package com.rentspace.domain.review;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * Kiểm tra nội dung comment có chứa từ ngữ vi phạm không.
 * Danh sách blacklist có thể mở rộng hoặc đọc từ DB sau này.
 */
@Service
public class ReviewModerationService {

    private static final List<String> BANNED_WORDS = List.of(
            "lừa đảo", "cheat", "scam", "fuck", "shit",
            "đồ chó", "đồ lợn", "ngu", "khốn nạn"
    );

    /**
     * Trả về true nếu comment chứa từ cấm.
     * null hoặc blank comment → không flag.
     */
    public boolean containsBannedContent(String comment) {
        if (comment == null || comment.isBlank()) return false;
        String lower = comment.toLowerCase(Locale.ROOT);
        return BANNED_WORDS.stream().anyMatch(lower::contains);
    }
}
