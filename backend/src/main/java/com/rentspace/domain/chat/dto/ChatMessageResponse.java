package com.rentspace.domain.chat.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Payload phản hồi tin nhắn tức thời qua WebSocket.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String messageType;
    private String fileUrl;
    private LocalDateTime createdAt;
}
