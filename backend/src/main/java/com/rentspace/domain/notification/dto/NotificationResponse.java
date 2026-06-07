package com.rentspace.domain.notification.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO phản hồi thông tin thông báo cho client qua REST API hoặc WebSocket.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String type;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
