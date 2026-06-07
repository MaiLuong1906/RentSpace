package com.rentspace.domain.chat.dto;

import lombok.*;

/**
 * Payload nhận tin nhắn mới từ WebSocket client.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageRequest {
    private Long receiverId;
    private String content;
    private String messageType;
    private String fileUrl;
}
