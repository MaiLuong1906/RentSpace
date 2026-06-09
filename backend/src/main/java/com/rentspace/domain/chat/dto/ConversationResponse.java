package com.rentspace.domain.chat.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO phản hồi thông tin cuộc hội thoại kèm theo tin nhắn cuối cùng và số tin chưa đọc.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private Long id;
    private Long otherParticipantId;
    private String otherParticipantName;
    private String otherParticipantAvatar;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;
    private Boolean isOnline;
}
