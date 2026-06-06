package com.rentspace.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisMessagePublisher {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(String destination, Object payload) {
        try {
            String payloadStr = payload instanceof String ? (String) payload : objectMapper.writeValueAsString(payload);
            RedisWSMessage wsMessage = new RedisWSMessage(destination, payloadStr);
            String messageJson = objectMapper.writeValueAsString(wsMessage);
            redisTemplate.convertAndSend("websocket_relay", messageJson);
            log.debug("Đã publish tin nhắn lên Redis Pub/Sub relay: {}", destination);
        } catch (Exception e) {
            log.error("Lỗi khi publish tin nhắn lên Redis Pub/Sub: {}", e.getMessage());
        }
    }
}
