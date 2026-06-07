package com.rentspace.domain.chat.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO phản hồi tin nhắn trong cuộc trò chuyện.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String content;
    private Boolean isOwn;
    private Boolean isRead;
    private String messageType;
    private String fileUrl;
    private LocalDateTime createdAt;
}
