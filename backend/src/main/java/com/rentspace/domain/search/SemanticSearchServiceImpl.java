package com.rentspace.domain.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.ai.AiUsageLog;
import com.rentspace.domain.ai.AiUsageLogRepository;
import com.rentspace.domain.ai.GeminiApiClient;
import com.rentspace.domain.listing.ListingService;
import com.rentspace.domain.listing.dto.ListingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SemanticSearchServiceImpl implements SemanticSearchService {

    private final GeminiApiClient groqClient;
    private final ListingService listingService;
    private final AiUsageLogRepository aiUsageRepo;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String MODEL = "llama-3.3-70b-versatile";
    private static final int RATE_LIMIT_PER_MINUTE = 20;
    private static final String CACHE_PREFIX = "semanticSearch:";

    private static final String SYSTEM_PROMPT = """
            Bạn là hệ thống trích xuất tiêu chí tìm kiếm phòng trọ tại Việt Nam.
            Phân tích câu hỏi và trả về JSON hợp lệ (null nếu không đề cập):
            {
              "city": "Đà Nẵng" | "Hà Nội" | "Hồ Chí Minh" | null,
              "district": "tên quận/huyện" | null,
              "minPrice": số VNĐ/tháng | null,
              "maxPrice": số VNĐ/tháng | null,
              "minArea": số m² | null,
              "roomType": "PHONG_TRO" | "CHUNG_CU_MINI" | "CHUNG_CU" | "NGAN_GIAN" | "NHA_NGUYEN_CAN" | null,
              "hasWifi": true | null,
              "hasAirConditioner": true | null,
              "hasParking": true | null,
              "hasWashingMachine": true | null,
              "keywords": "từ khóa đặc thù không map được" | null
            }
            QUY TẮC CỨNG (không được vi phạm):
            City normalization — luôn dùng tên chuẩn:
              "tphcm","tp hcm","hcm","sài gòn","saigon","sg" → "Hồ Chí Minh"
              "hn","hà nội","ha noi" → "Hà Nội"
              "đà nẵng","da nang","dn","đnẵng" → "Đà Nẵng"
            Giá:
              "2-3 triệu" → minPrice:2000000, maxPrice:3000000
              "dưới 3 triệu" → maxPrice:3000000
              "trên 5 triệu" → minPrice:5000000
              "4tr" / "4 tr" → maxPrice:4000000
            Loại phòng:
              "phòng trọ","trọ","phòng thuê" → PHONG_TRO
              "studio","gác lửng","chung cư mini","căn hộ mini" → CHUNG_CU_MINI
              "chung cư","căn hộ","cc" → CHUNG_CU
              "nhà nguyên căn","nguyên căn","nhà riêng" → NHA_NGUYEN_CAN
              "ngăn gian","phòng ngăn" → NGAN_GIAN
            Keywords — dùng khi có địa danh/mô tả đặc thù:
              "gần ĐH Bách Khoa" → keywords:"Bách Khoa"
              "gần biển" → keywords:"biển"
              "view đẹp","yên tĩnh","thoáng mát" → keywords:"view đẹp"
              "gần chợ","trung tâm","sầm uất" → keywords tương ứng
            Tiện ích — chỉ điền khi user nêu rõ, đừng suy diễn:
              "có wifi","wifi miễn phí" → hasWifi:true
              "có điều hòa","có máy lạnh" → hasAirConditioner:true
              "có chỗ để xe","có garage","có bãi xe" → hasParking:true
              "có máy giặt" → hasWashingMachine:true
            TUYỆT ĐỐI không thêm thông tin không có trong câu hỏi.
            Chỉ trả về JSON, không giải thích.
            """;

    @Override
    public SemanticSearchResponse search(SemanticSearchRequest request, String clientIp) {
        String naturalQuery = request.query().trim();
        List<SemanticSearchRequest.ConversationTurn> history =
                request.history() != null ? request.history() : List.of();

        checkRateLimit(clientIp);

        // Không cache khi có history (kết quả phụ thuộc context hội thoại)
        String cacheKey = history.isEmpty()
                ? CACHE_PREFIX + DigestUtils.md5DigestAsHex(
                        naturalQuery.toLowerCase().trim().getBytes(StandardCharsets.UTF_8))
                : null;

        // Kiểm tra cache — bỏ qua khi có history (kết quả phụ thuộc context hội thoại)
        if (cacheKey != null) {
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                try {
                    return objectMapper.readValue(cached, SemanticSearchResponse.class);
                } catch (Exception e) {
                    log.warn("Không thể parse cache semantic search, bỏ qua: {}", e.getMessage());
                }
            }
        }

        ExtractedSearchParams params;
        boolean usedFallback = false;

        try {
            params = extractParamsWithGroq(naturalQuery, history);
        } catch (Exception e) {
            log.warn("Semantic extraction thất bại cho query: {}", naturalQuery, e);
            params = ExtractedSearchParams.keywordFallback(naturalQuery);
            usedFallback = true;
        }

        Page<ListingResponse> page = listingService.searchSemantic(params, PageRequest.of(0, 30));
        SemanticSearchResponse result = new SemanticSearchResponse(
                params, page.getContent(), page.getTotalElements(), usedFallback);

        // Lưu cache — bỏ qua khi có history
        if (cacheKey != null) {
            try {
                String json = objectMapper.writeValueAsString(result);
                redisTemplate.opsForValue().set(cacheKey, json, Duration.ofHours(1));
            } catch (Exception e) {
                log.warn("Không thể lưu cache semantic search (bỏ qua): {}", e.getMessage());
            }
        }

        return result;
    }

    private ExtractedSearchParams extractParamsWithGroq(
            String query, List<SemanticSearchRequest.ConversationTurn> history) throws Exception {
        long start = System.currentTimeMillis();

        List<GeminiApiClient.Message> historyMessages = history.stream()
                .map(t -> new GeminiApiClient.Message(t.role(), t.content()))
                .toList();

        GeminiApiClient.GeminiResult groqResult = historyMessages.isEmpty()
                ? groqClient.generateJsonContent(MODEL, SYSTEM_PROMPT, "Câu tìm kiếm: \"" + query + "\"")
                : groqClient.generateJsonContentWithHistory(MODEL, SYSTEM_PROMPT, historyMessages,
                        "Câu tìm kiếm: \"" + query + "\"");

        ExtractedSearchParams params = objectMapper.readValue(groqResult.text(), ExtractedSearchParams.class);

        aiUsageRepo.save(AiUsageLog.builder()
                .userId(null)
                .contractId(null)
                .feature("SEMANTIC_SEARCH")
                .modelUsed(MODEL)
                .inputTokens(groqResult.inputTokens())
                .outputTokens(groqResult.outputTokens())
                .latencyMs((int) (System.currentTimeMillis() - start))
                .build());

        return params;
    }

    private void checkRateLimit(String clientIp) {
        String key = "rate:semantic:" + clientIp + ":" + (System.currentTimeMillis() / 60_000);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofMinutes(2));
        }
        if (count != null && count > RATE_LIMIT_PER_MINUTE) {
            throw new BusinessException("Quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau 1 phút.");
        }
    }
}
