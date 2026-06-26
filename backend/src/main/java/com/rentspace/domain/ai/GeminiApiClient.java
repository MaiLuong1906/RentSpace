package com.rentspace.domain.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.rentspace.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * Gọi Groq API (OpenAI-compatible) — provider thay thế Gemini, không yêu cầu billing.
 * Đăng ký key miễn phí tại: https://console.groq.com
 */
@Component
public class GeminiApiClient {

    private final RestClient restClient;

    public GeminiApiClient(@Value("${ai.groq.api-key}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    /**
     * Gọi model với system prompt + user message, trả về kết quả đã parse.
     *
     * @param model        "llama-3.1-8b-instant" | "llama-3.3-70b-versatile"
     * @param systemPrompt Hướng dẫn hành vi cho AI
     * @param userMessage  Câu hỏi từ người dùng
     */
    public GeminiResult generateContent(String model, String systemPrompt, String userMessage) {
        var requestBody = new ChatRequest(
                model,
                List.of(
                        new Message("system", systemPrompt),
                        new Message("user", userMessage)
                ),
                0.7
        );

        ChatResponse response;
        try {
            response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(ChatResponse.class);
        } catch (RestClientException e) {
            throw new BusinessException("Không thể kết nối đến Groq API: " + e.getMessage());
        }

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new BusinessException("Groq API trả về phản hồi không hợp lệ");
        }

        String text = response.choices().get(0).message().content();
        Usage usage = response.usage();

        return new GeminiResult(
                text,
                usage != null ? usage.promptTokens() : 0,
                usage != null ? usage.completionTokens() : 0,
                usage != null ? usage.totalTokens() : 0
        );
    }

    // ─── Public result record ─────────────────────────────────────────────────

    public record GeminiResult(String text, int inputTokens, int outputTokens, int totalTokens) {}

    // ─── Internal request/response DTOs ──────────────────────────────────────

    record ChatRequest(String model, List<Message> messages, double temperature) {}

    record Message(String role, String content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatResponse(List<Choice> choices, Usage usage) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(Message message) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Usage(
            @JsonProperty("prompt_tokens")     int promptTokens,
            @JsonProperty("completion_tokens") int completionTokens,
            @JsonProperty("total_tokens")      int totalTokens
    ) {}
}
