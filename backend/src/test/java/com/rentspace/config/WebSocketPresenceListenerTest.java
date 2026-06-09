package com.rentspace.config;

import com.rentspace.domain.chat.UserPresenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketPresenceListenerTest {

    @Mock
    private UserPresenceService presenceService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private WebSocketPresenceListener presenceListener;

    private Principal mockPrincipal;
    private Message<byte[]> mockMessage;

    @BeforeEach
    void setUp() {
        mockPrincipal = new StompPrincipal("123");
        
        // Tạo message giả lập chứa user principal trong headers để accessor có thể wrap và lấy ra được
        mockMessage = MessageBuilder.withPayload(new byte[0])
                .setHeader(SimpMessageHeaderAccessor.USER_HEADER, mockPrincipal)
                .build();
    }

    @Test
    void handleWebSocketConnectListener_WhenJustOnline_ShouldBroadcastOnline() {
        // Given
        SessionConnectedEvent event = new SessionConnectedEvent(this, mockMessage, mockPrincipal);
        when(presenceService.setOnline(123L)).thenReturn(true); // Trạng thái chuyển từ offline sang online

        // When
        presenceListener.handleWebSocketConnectListener(event);

        // Then
        verify(presenceService, times(1)).setOnline(123L);
        
        // Capture message gửi đi
        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/users.presence"),
                payloadCaptor.capture()
        );
        
        Map<String, Object> payload = payloadCaptor.getValue();
        assertEquals(123L, payload.get("userId"));
        assertEquals("ONLINE", payload.get("status"));
    }

    @Test
    void handleWebSocketConnectListener_WhenAlreadyOnline_ShouldNotBroadcast() {
        // Given
        SessionConnectedEvent event = new SessionConnectedEvent(this, mockMessage, mockPrincipal);
        when(presenceService.setOnline(123L)).thenReturn(false); // Đã online từ trước (mở tab thứ 2)

        // When
        presenceListener.handleWebSocketConnectListener(event);

        // Then
        verify(presenceService, times(1)).setOnline(123L);
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    @Test
    void handleWebSocketDisconnectListener_WhenJustOffline_ShouldBroadcastOffline() {
        // Given
        SessionDisconnectEvent event = new SessionDisconnectEvent(
                this, mockMessage, "session-id", CloseStatus.NORMAL, mockPrincipal
        );
        when(presenceService.setOffline(123L)).thenReturn(true); // Trạng thái chuyển hẳn sang offline

        // When
        presenceListener.handleWebSocketDisconnectListener(event);

        // Then
        verify(presenceService, times(1)).setOffline(123L);
        
        ArgumentCaptor<Map<String, Object>> payloadCaptor = ArgumentCaptor.forClass(Map.class);
        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/users.presence"),
                payloadCaptor.capture()
        );
        
        Map<String, Object> payload = payloadCaptor.getValue();
        assertEquals(123L, payload.get("userId"));
        assertEquals("OFFLINE", payload.get("status"));
    }

    @Test
    void handleWebSocketDisconnectListener_WhenStillOnline_ShouldNotBroadcast() {
        // Given
        SessionDisconnectEvent event = new SessionDisconnectEvent(
                this, mockMessage, "session-id", CloseStatus.NORMAL, mockPrincipal
        );
        when(presenceService.setOffline(123L)).thenReturn(false); // Vẫn còn tab khác kết nối

        // When
        presenceListener.handleWebSocketDisconnectListener(event);

        // Then
        verify(presenceService, times(1)).setOffline(123L);
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }
}
