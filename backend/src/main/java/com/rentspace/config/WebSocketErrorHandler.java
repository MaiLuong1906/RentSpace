package com.rentspace.config;

import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

/**
 * Bộ xử lý lỗi WebSocket tùy chỉnh.
 * Giúp trích xuất thông điệp lỗi gốc (root cause) thay vì trả về lỗi mặc định của Spring
 * như "Failed to send message to ExecutorSubscribableChannel[clientInboundChannel]".
 */
@Component
public class WebSocketErrorHandler extends StompSubProtocolErrorHandler {

    public WebSocketErrorHandler() {
        super();
    }

    @Override
    public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> clientMessage, Throwable ex) {
        Throwable cause = ex;
        // Duyệt tìm nguyên nhân gốc của lỗi (ví dụ: IllegalArgumentException từ AuthChannelInterceptor)
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }

        String errorMessage = cause.getMessage();
        if (errorMessage == null) {
            errorMessage = "Đã xảy ra lỗi không xác định khi xử lý tin nhắn socket.";
        }

        return prepareErrorMessage(clientMessage, errorMessage);
    }

    private Message<byte[]> prepareErrorMessage(Message<byte[]> clientMessage, String errorMessage) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.ERROR);
        accessor.setMessage(errorMessage);
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
