package com.rentspace.domain.search;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.ai.GeminiApiClient;
import com.rentspace.domain.listing.ListingService;
import com.rentspace.domain.listing.dto.ListingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssistantSearchServiceImpl implements AssistantSearchService {

    private final GeminiApiClient groqClient;
    private final ListingService listingService;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String MODEL = "llama-3.3-70b-versatile";
    private static final int RATE_LIMIT_PER_MINUTE = 20;

    private static final String SYSTEM_PROMPT = """
            Bạn là Trợ lý RentSpace — chuyên gia tư vấn tìm phòng trọ tại Việt Nam.

            NGUYÊN TẮC:
            - Trả lời bằng tiếng Việt, thân thiện và thực tế (không sáo rỗng)
            - Phản hồi NGẮN GỌN — tối đa 2-3 câu, tập trung vào giá trị thực sự
            - Nhớ và dùng ngữ cảnh từ lịch sử hội thoại trước
            - Khi thiếu thành phố HOẶC ngân sách: hỏi làm rõ, KHÔNG tìm kiếm
            - Khi đủ thông tin: tìm kiếm ngay và giới thiệu kết quả một cách tự nhiên

            LUÔN trả về JSON (không markdown, không text ngoài JSON):
            {
              "message": "Câu trả lời tư vấn tự nhiên (BẮT BUỘC — không để trống)",
              "shouldSearch": true | false,
              "searchParams": {
                "city": "Đà Nẵng" | "Hà Nội" | "Hồ Chí Minh" | null,
                "district": "tên quận/huyện" | null,
                "minPrice": số_VNĐ_mỗi_tháng | null,
                "maxPrice": số_VNĐ_mỗi_tháng | null,
                "minArea": số_m2 | null,
                "roomType": "PHONG_TRO" | "CHUNG_CU_MINI" | "CHUNG_CU" | "NGAN_GIAN" | "NHA_NGUYEN_CAN" | null,
                "hasWifi": true | null,
                "hasAirConditioner": true | null,
                "hasParking": true | null,
                "hasWashingMachine": true | null,
                "keywords": "từ khóa đặc thù không map được" | null
              }
            }
            Nếu shouldSearch: false thì searchParams có thể null.

            CHUẨN HÓA ĐỊA DANH:
            "tphcm","tp hcm","sài gòn","saigon","hcm","sg" → "Hồ Chí Minh"
            "hn","hà nội","ha noi" → "Hà Nội"
            "đà nẵng","da nang","dn","đnẵng" → "Đà Nẵng"

            CHUẨN HÓA GIÁ:
            "2-3 triệu" → minPrice:2000000, maxPrice:3000000
            "dưới 3 triệu","< 3tr" → maxPrice:3000000
            "4tr","4 triệu" → maxPrice:4000000

            CHUẨN HÓA LOẠI PHÒNG:
            "phòng trọ","trọ","phòng thuê" → PHONG_TRO
            "studio","gác lửng","chung cư mini","căn hộ mini" → CHUNG_CU_MINI
            "chung cư","căn hộ","cc" → CHUNG_CU
            "nhà nguyên căn","nguyên căn","nhà riêng","nhà phố" → NHA_NGUYEN_CAN (và keywords:"nguyên căn")
            "ngăn gian","phòng ngăn" → NGAN_GIAN

            KEYWORDS — dùng cho địa danh/mô tả đặc thù:
            "gần ĐH Bách Khoa" → keywords:"Bách Khoa"
            "gần biển" → keywords:"biển"
            "trung tâm","gần chợ" → keywords tương ứng

            VÍ DỤ HÀNH VI:
            User: "tìm phòng cho tôi"
            → {"message":"Bạn muốn thuê phòng ở thành phố nào và ngân sách khoảng bao nhiêu mỗi tháng?","shouldSearch":false,"searchParams":null}

            User: "Đà Nẵng, khoảng 3 triệu"
            → {"message":"3 triệu ở Đà Nẵng thuê được phòng trọ ổn, nhất là khu Hải Châu và Thanh Khê. Mình tìm ngay cho bạn!","shouldSearch":true,"searchParams":{"city":"Đà Nẵng","maxPrice":3000000}}

            User: "có wifi không, ở gần biển"
            → {"message":"Mình lọc thêm WiFi và gần biển. Khu Mỹ Khê - Ngũ Hành Sơn của Đà Nẵng rất hợp, view đẹp mà giá cũng ổn!","shouldSearch":true,"searchParams":{"city":"Đà Nẵng","maxPrice":3000000,"hasWifi":true,"keywords":"biển"}}

            User: "rẻ hơn được không"
            → {"message":"Oke, mình hạ xuống. Dưới 2 triệu thường là phòng nhỏ ~15m² ở các ngõ hẻm, nhưng vẫn có WiFi và vị trí ổn.","shouldSearch":true,"searchParams":{"city":"Đà Nẵng","maxPrice":2000000,"hasWifi":true,"keywords":"biển"}}
            """;

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GroqAssistantResult(
            String message,
            boolean shouldSearch,
            ExtractedSearchParams searchParams
    ) {}

    private record SearchResult(
            Page<ListingResponse> page,
            ExtractedSearchParams params,
            boolean fallback
    ) {}

    @Override
    public AssistantSearchResponse chat(SemanticSearchRequest request, String clientIp) {
        checkRateLimit(clientIp);

        String query = request.query().trim();
        List<SemanticSearchRequest.ConversationTurn> history =
                request.history() != null ? request.history() : List.of();

        GroqAssistantResult aiResult;
        try {
            aiResult = callGroqAssistant(query, history);
        } catch (Exception e) {
            log.warn("Assistant AI thất bại cho query: {}", query, e);
            return new AssistantSearchResponse(
                    "Xin lỗi, mình gặp sự cố nhỏ. Bạn thử lại sau giây lát nhé!",
                    null, List.of(), 0, false);
        }

        // Nếu AI không muốn search (hỏi làm rõ hoặc đang tư vấn)
        if (!aiResult.shouldSearch() || aiResult.searchParams() == null) {
            return new AssistantSearchResponse(
                    aiResult.message(), null, List.of(), 0, false);
        }

        // Tìm kiếm với progressive relaxation
        SearchResult sr = searchWithRelaxation(aiResult.searchParams(), query);
        return new AssistantSearchResponse(
                aiResult.message(),
                sr.params(),
                sr.page().getContent(),
                sr.page().getTotalElements(),
                sr.fallback()
        );
    }

    private GroqAssistantResult callGroqAssistant(
            String query, List<SemanticSearchRequest.ConversationTurn> history) throws Exception {

        List<GeminiApiClient.Message> historyMessages = history.stream()
                .map(t -> new GeminiApiClient.Message(t.role(), t.content()))
                .toList();

        GeminiApiClient.GeminiResult result = historyMessages.isEmpty()
                ? groqClient.generateJsonContent(MODEL, SYSTEM_PROMPT, query)
                : groqClient.generateJsonContentWithHistory(MODEL, SYSTEM_PROMPT, historyMessages, query);

        return objectMapper.readValue(result.text(), GroqAssistantResult.class);
    }

    // Progressive relaxation: nới lỏng dần nếu 0 kết quả
    private SearchResult searchWithRelaxation(ExtractedSearchParams params, String originalQuery) {
        // 1. Full strict search
        var page = listingService.searchSemantic(params, PageRequest.of(0, 30));
        if (page.getTotalElements() > 0) return new SearchResult(page, params, false);

        // 2. Drop district + amenities + minArea
        var p2 = new ExtractedSearchParams(
                params.city(), null,
                params.minPrice(), params.maxPrice(),
                null, params.roomType(),
                null, null, null, null,
                params.keywords());
        page = listingService.searchSemantic(p2, PageRequest.of(0, 30));
        if (page.getTotalElements() > 0) return new SearchResult(page, p2, true);

        // 3. Drop roomType → chuyển thành keyword LIKE để bắt listing có title/description khớp
        String roomKw = roomTypeToKeyword(params.roomType());
        String combinedKw = mergeKeywords(params.keywords(), roomKw);
        var p3 = new ExtractedSearchParams(
                params.city(), null,
                params.minPrice(), params.maxPrice(),
                null, null,
                null, null, null, null,
                combinedKw);
        page = listingService.searchSemantic(p3, PageRequest.of(0, 30));
        if (page.getTotalElements() > 0) return new SearchResult(page, p3, true);

        // 4. Drop price constraints
        var p4 = new ExtractedSearchParams(
                params.city(), null,
                null, null,
                null, null,
                null, null, null, null,
                combinedKw);
        page = listingService.searchSemantic(p4, PageRequest.of(0, 30));
        if (page.getTotalElements() > 0) return new SearchResult(page, p4, true);

        // 5. Full keyword fallback trên câu gốc của user
        var fallback = ExtractedSearchParams.keywordFallback(originalQuery);
        page = listingService.searchSemantic(fallback, PageRequest.of(0, 30));
        return new SearchResult(page, fallback, true);
    }

    private static String roomTypeToKeyword(String roomType) {
        if (roomType == null) return null;
        return switch (roomType) {
            case "NHA_NGUYEN_CAN" -> "nguyên căn";
            case "CHUNG_CU_MINI" -> "chung cư mini";
            case "CHUNG_CU" -> "chung cư";
            case "NGAN_GIAN" -> "ngăn gian";
            default -> null;
        };
    }

    private static String mergeKeywords(String existing, String extra) {
        if (extra == null) return existing;
        if (existing == null) return extra;
        return existing + " " + extra;
    }

    private void checkRateLimit(String clientIp) {
        String key = "rate:assistant:" + clientIp + ":" + (System.currentTimeMillis() / 60_000);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofMinutes(2));
        }
        if (count != null && count > RATE_LIMIT_PER_MINUTE) {
            throw new BusinessException("Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.");
        }
    }
}
