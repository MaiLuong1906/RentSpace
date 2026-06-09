package com.rentspace.config;

import com.rentspace.domain.chat.UserPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

/**
 * Lắng nghe các sự kiện vòng đời của phiên kết nối WebSocket để cập nhật trạng thái hoạt động (online/offline).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketPresenceListener {

    private final UserPresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();
        if (principal != null) {
            try {
                Long userId = Long.parseLong(principal.getName());
                log.info("Người dùng ID {} đã kết nối WebSocket (CONNECT)", userId);
                boolean justOnline = presenceService.setOnline(userId);
                
                if (justOnline) {
                    log.info("Phát broadcast trạng thái ONLINE của User ID: {}", userId);
                    broadcastPresence(userId, true);
                }
            } catch (NumberFormatException e) {
                log.error("Không thể phân tích User ID từ principal name: {}", principal.getName());
            }
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();
        if (principal != null) {
            try {
                Long userId = Long.parseLong(principal.getName());
                log.info("Người dùng ID {} đã ngắt kết nối WebSocket (DISCONNECT)", userId);
                boolean justOffline = presenceService.setOffline(userId);
                
                if (justOffline) {
                    log.info("Phát broadcast trạng thái OFFLINE của User ID: {}", userId);
                    broadcastPresence(userId, false);
                }
            } catch (NumberFormatException e) {
                log.error("Không thể phân tích User ID từ principal name: {}", principal.getName());
            }
        }
    }

    private void broadcastPresence(Long userId, boolean isOnline) {
        try {
            messagingTemplate.convertAndSend(
                    "/topic/users.presence",
                    Map.of(
                            "userId", userId,
                            "status", isOnline ? "ONLINE" : "OFFLINE"
                    )
            );
        } catch (Exception e) {
            log.error("Lỗi khi phát broadcast trạng thái hoạt động của user {}: {}", userId, e.getMessage());
        }
    }
}
