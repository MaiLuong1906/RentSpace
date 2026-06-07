package com.rentspace.config;

import com.rentspace.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");
            if (authorization != null && !authorization.isEmpty()) {
                String authHeader = authorization.get(0);
                if (authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    try {
                        String username = jwtTokenProvider.extractUsername(token);
                        if (username != null && accessor.getUser() == null) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            if (jwtTokenProvider.isTokenValid(token, userDetails)
                                    && userDetails instanceof com.rentspace.domain.user.CustomUserDetails customUserDetails) {
                                StompPrincipal principal = new StompPrincipal(
                                        customUserDetails.getUser().getId().toString());
                                accessor.setUser(principal);
                                log.info("Xác thực thành công kết nối WebSocket cho user id: {} (email: {})",
                                        customUserDetails.getUser().getId(), username);
                            }
                        }
                    } catch (Exception e) {
                        log.error("Lỗi khi xác thực token WebSocket: {}", e.getMessage());
                    }
                }
            }
        }
        return message;
    }
}
