package com.rentspace.domain.contract;

import com.rentspace.common.exception.AiQuotaExceededException;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.ai.AiUsageLog;
import com.rentspace.domain.ai.AiUsageLogRepository;
import com.rentspace.domain.ai.GeminiApiClient;
import com.rentspace.domain.ai.GeminiApiClient.GeminiResult;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.dto.request.ContractAiRequest;
import com.rentspace.dto.response.AiQuotaResponse;
import com.rentspace.dto.response.ContractAiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractAiServiceImpl implements ContractAiService {

    private static final String FEATURE    = "CONTRACT_ASSISTANT";
    private static final ZoneId VN_ZONE    = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Set<String> COMPLEX_KEYWORDS = Set.of(
            "bất khả kháng", "đơn phương chấm dứt", "bồi thường thiệt hại",
            "tranh chấp", "tòa án", "vi phạm nghiêm trọng", "phạt vi phạm"
    );

    private final GeminiApiClient geminiApiClient;
    private final ContractRepository contractRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final UserRepository userRepository;

    @Value("${ai.contract-assistant.default-model}")
    private String defaultModel;

    @Value("${ai.contract-assistant.fallback-model}")
    private String fallbackModel;

    @Value("${ai.contract-assistant.max-questions-per-contract-per-day}")
    private int maxQuestionsPerDay;

    @Override
    @Transactional
    public ContractAiResponse ask(Long contractId, String userEmail, ContractAiRequest request) {
        User user = loadUser(userEmail);
        Contract contract = loadContract(contractId);
        validateAccess(contract, user.getId());
        validateContractStatus(contract);

        int todayCount = countTodayUsage(user.getId(), contractId);
        if (todayCount >= maxQuestionsPerDay) {
            throw new AiQuotaExceededException(
                    "Bạn đã hỏi " + maxQuestionsPerDay + " câu hỏi hôm nay. Hãy thử lại vào ngày mai.");
        }

        String question = request.getQuestion();
        String model = isComplexQuestion(question) ? fallbackModel : defaultModel;
        String systemPrompt = buildSystemPrompt(contract.getContentSnapshot());

        long start = System.currentTimeMillis();
        GeminiResult result = geminiApiClient.generateContent(model, systemPrompt, question);
        int latencyMs = (int) (System.currentTimeMillis() - start);

        aiUsageLogRepository.save(AiUsageLog.builder()
                .userId(user.getId())
                .contractId(contractId)
                .feature(FEATURE)
                .modelUsed(model)
                .inputTokens(result.inputTokens())
                .outputTokens(result.outputTokens())
                .latencyMs(latencyMs)
                .build());

        return ContractAiResponse.builder()
                .answer(result.text())
                .tokensUsed(result.totalTokens())
                .questionsToday(todayCount + 1)
                .dailyLimit(maxQuestionsPerDay)
                .build();
    }

    @Override
    public AiQuotaResponse getQuota(Long contractId, String userEmail) {
        User user = loadUser(userEmail);
        Contract contract = loadContract(contractId);
        validateAccess(contract, user.getId());

        int used = countTodayUsage(user.getId(), contractId);
        Instant resetsAt = LocalDate.now(VN_ZONE).plusDays(1)
                .atStartOfDay(VN_ZONE)
                .toInstant();

        return AiQuotaResponse.builder()
                .used(used)
                .limit(maxQuestionsPerDay)
                .resetsAt(resetsAt)
                .build();
    }

    // ─── private helpers ───────────────────────────────────────────────────────

    private User loadUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));
    }

    private Contract loadContract(Long contractId) {
        return contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hợp đồng không tìm thấy với id: " + contractId));
    }

    private void validateAccess(Contract contract, Long userId) {
        boolean isParty = contract.getLandlord().getId().equals(userId)
                || contract.getTenant().getId().equals(userId);
        if (!isParty) {
            throw new BusinessException("Bạn không có quyền hỏi AI về hợp đồng này");
        }
    }

    private void validateContractStatus(Contract contract) {
        ContractStatus status = contract.getStatus();
        if (status != ContractStatus.PENDING_SIGNATURES && status != ContractStatus.FULLY_SIGNED) {
            throw new BusinessException(
                    "AI assistant chỉ khả dụng cho hợp đồng đang chờ ký hoặc đã ký đầy đủ");
        }
    }

    private int countTodayUsage(Long userId, Long contractId) {
        Instant startOfToday = LocalDate.now(VN_ZONE).atStartOfDay(VN_ZONE).toInstant();
        return aiUsageLogRepository.countByUserIdAndContractIdAndFeatureAndCreatedAtAfter(
                userId, contractId, FEATURE, startOfToday);
    }

    private boolean isComplexQuestion(String question) {
        String lower = question.toLowerCase();
        return question.length() > 200
                || COMPLEX_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private String buildSystemPrompt(String contractContent) {
        return """
                Bạn là trợ lý pháp lý chuyên về hợp đồng thuê nhà tại Việt Nam.

                NHIỆM VỤ: Giải thích và phân tích các điều khoản trong hợp đồng dưới đây.

                GIỚI HẠN BẮT BUỘC:
                - Chỉ trả lời câu hỏi liên quan đến hợp đồng được cung cấp.
                - Không gợi ý sửa đổi điều khoản pháp lý.
                - Không đưa ra tư vấn pháp lý chuyên nghiệp.
                - Nếu câu hỏi nằm ngoài phạm vi hợp đồng này, từ chối lịch sự và hướng dẫn người dùng liên hệ luật sư.

                PHONG CÁCH: Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng, dễ hiểu với người không có nền tảng pháp lý.

                HỢP ĐỒNG:
                """ + contractContent;
    }
}
