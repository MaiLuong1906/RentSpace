package com.rentspace.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthChannelInterceptor authChannelInterceptor;
    private final WebSocketErrorHandler webSocketErrorHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients subscribe to /topic/... or /queue/...
        registry.enableSimpleBroker("/topic", "/queue");
        // Messages sent from client to server: /app/...
        registry.setApplicationDestinationPrefixes("/app");
        // User-specific messages: /user/{userId}/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000", "https://rentspace.vn")
                .withSockJS(); // Fallback for browsers that don't support WebSocket
        
        registry.setErrorHandler(webSocketErrorHandler);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}

