package com.rentspace.infrastructure.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RedisMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            RedisWSMessage wsMessage = objectMapper.readValue(message.getBody(), RedisWSMessage.class);
            log.debug("Nhận tin nhắn từ Redis Pub/Sub relay tới topic: {}", wsMessage.getDestination());
            messagingTemplate.convertAndSend(wsMessage.getDestination(), wsMessage.getPayload());
        } catch (Exception e) {
            log.error("Lỗi khi giải mã tin nhắn từ Redis Pub/Sub: {}", e.getMessage());
        }
    }
}
