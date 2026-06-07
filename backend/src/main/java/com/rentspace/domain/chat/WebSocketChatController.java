package com.rentspace.domain.chat;

import com.rentspace.domain.chat.dto.ChatMessageRequest;
import com.rentspace.domain.chat.dto.ChatMessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.rentspace.domain.user.User;

import java.security.Principal;
import java.time.LocalDateTime;

/**
 * Controller WebSocket xử lý gửi/nhận tin nhắn thời gian thực qua giao thức STOMP.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void handleIncomingMessage(@Payload ChatMessageRequest request, Principal principal) {
        if (principal == null) {
            log.error("Kết nối WebSocket chưa được xác thực, bỏ qua tin nhắn.");
            return;
        }

        // principal.getName() trả về User ID do ta đã ánh xạ qua StompPrincipal trong AuthChannelInterceptor
        Long senderId = Long.parseLong(principal.getName());
        log.info("Nhận tin nhắn WebSocket từ senderId={} tới receiverId={}", senderId, request.getReceiverId());

        if (senderId.equals(request.getReceiverId())) {
            log.warn("User {} đang tự gửi tin nhắn cho chính mình, bỏ qua.", senderId);
            return;
        }

        // 1. Tìm hoặc tự tạo phòng chat (Conversation)
        Conversation conversation = chatService.getOrCreateConversation(senderId, request.getReceiverId());

        // 2. Tạo phản hồi nhanh để phát tức thời qua WebSocket
        ChatMessageResponse response = ChatMessageResponse.builder()
                .conversationId(conversation.getId())
                .senderId(senderId)
                .receiverId(request.getReceiverId())
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .fileUrl(request.getFileUrl())
                .createdAt(LocalDateTime.now())
                .build();
 
        // 3. Phát tin tức thời cho người nhận (Receiver) qua hàng đợi riêng của họ
        messagingTemplate.convertAndSendToUser(
                request.getReceiverId().toString(),
                "/queue/messages",
                response
        );
 
        // 4. Phát ngược lại cho chính người gửi (Sender) để đồng bộ đa thiết bị/tab
        messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/queue/messages",
                response
        );
 
        // 5. Lưu database bất đồng bộ để tối ưu tốc độ phản hồi socket
        chatService.saveMessageAsync(conversation.getId(), senderId, request.getContent(), request.getMessageType(), request.getFileUrl());
    }

    @MessageMapping("/chat.read")
    public void handleIncomingReadNotification(@Payload java.util.Map<String, Object> payload, Principal principal) {
        if (principal == null) {
            log.error("Yêu cầu báo đọc WebSocket chưa được xác thực.");
            return;
        }

        Long userId = Long.parseLong(principal.getName());
        Object convIdObj = payload.get("conversationId");
        if (convIdObj == null) {
            log.error("Thiếu conversationId trong payload báo đọc.");
            return;
        }
        Long conversationId = (convIdObj instanceof Number number) 
                ? number.longValue() 
                : Long.parseLong(convIdObj.toString());
        log.info("Nhận tín hiệu báo đã xem cuộc hội thoại {} từ userId={}", conversationId, userId);

        // 1. Đánh dấu đã đọc trong Database
        chatService.markConversationAsRead(conversationId, userId);
 
        // 2. Tìm đối phương để chuyển tiếp thông báo đã đọc (Gọi qua Service giao dịch để tránh LazyInitializationException)
        Long otherParticipantId = chatService.getOtherParticipantId(conversationId, userId);
 
        // 3. Phát tin tức thời cho đối phương biết hội thoại đã được xem
        messagingTemplate.convertAndSendToUser(
                otherParticipantId.toString(),
                "/queue/messages.read",
                java.util.Map.of("conversationId", conversationId, "readerId", userId)
        );
    }

    @MessageMapping("/chat.typing")
    public void handleIncomingTypingNotification(@Payload java.util.Map<String, Object> payload, Principal principal) {
        if (principal == null) {
            return;
        }

        Long userId = Long.parseLong(principal.getName());
        Object convIdObj = payload.get("conversationId");
        Object isTypingObj = payload.get("isTyping");
        if (convIdObj == null || isTypingObj == null) {
            return;
        }

        Long conversationId = (convIdObj instanceof Number number) 
                ? number.longValue() 
                : Long.parseLong(convIdObj.toString());
        Boolean isTyping = Boolean.parseBoolean(isTypingObj.toString());

        // Tìm đối phương
        Long otherParticipantId = chatService.getOtherParticipantId(conversationId, userId);

        // Phát tin tức thời báo đối phương đang nhập/dừng nhập
        messagingTemplate.convertAndSendToUser(
                otherParticipantId.toString(),
                "/queue/messages.typing",
                java.util.Map.of(
                        "conversationId", conversationId,
                        "userId", userId,
                        "isTyping", isTyping
                )
        );
    }
}
