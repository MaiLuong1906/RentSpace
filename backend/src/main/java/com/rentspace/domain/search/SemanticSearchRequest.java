package com.rentspace.domain.search;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SemanticSearchRequest(
        @NotBlank(message = "Câu tìm kiếm không được để trống")
        @Size(max = 500, message = "Câu tìm kiếm không được vượt quá 500 ký tự")
        String query,

        // Lịch sử hội thoại để AI hiểu ngữ cảnh các lượt trước (nullable)
        List<ConversationTurn> history
) {
    public record ConversationTurn(String role, String content) {}
}
