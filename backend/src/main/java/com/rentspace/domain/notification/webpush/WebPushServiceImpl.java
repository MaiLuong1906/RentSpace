package com.rentspace.domain.notification.webpush;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.notification.webpush.dto.WebPushPayload;
import com.rentspace.domain.notification.webpush.dto.WebPushSubscribeRequest;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WebPushServiceImpl implements WebPushService {

    private final WebPushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PushService pushService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void subscribe(Long userId, WebPushSubscribeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại với id: " + userId));

        // Nếu endpoint đã tồn tại, cập nhật lại thay vì tạo mới
        WebPushSubscription subscription = subscriptionRepository
                .findByEndpoint(request.getEndpoint())
                .orElseGet(WebPushSubscription::new);

        subscription.setUser(user);
        subscription.setEndpoint(request.getEndpoint());
        subscription.setP256dh(request.getKeys().getP256dh());
        subscription.setAuth(request.getKeys().getAuth());
        subscription.setUserAgent(request.getUserAgent());
        subscription.setIsActive(true);
        subscription.setLastUsedAt(OffsetDateTime.now());

        subscriptionRepository.save(subscription);
        log.info("Đã lưu Web Push subscription cho User ID: {}", userId);
    }

    @Override
    @Transactional
    public void unsubscribe(String endpoint) {
        subscriptionRepository.findByEndpoint(endpoint).ifPresent(sub -> {
            sub.setIsActive(false);
            subscriptionRepository.save(sub);
            log.info("Đã hủy Web Push subscription: {}", endpoint);
        });
    }

    @Override
    @Async
    public void sendToUser(Long userId, WebPushPayload payload) {
        List<WebPushSubscription> subscriptions =
                subscriptionRepository.findAllByUserIdAndIsActiveTrue(userId);

        if (subscriptions.isEmpty()) {
            return;
        }

        byte[] payloadBytes;
        try {
            payloadBytes = objectMapper.writeValueAsBytes(payload);
        } catch (JsonProcessingException e) {
            log.error("Không thể serialize WebPushPayload cho User ID: {}", userId, e);
            return;
        }

        for (WebPushSubscription sub : subscriptions) {
            trySendToSubscription(sub, payloadBytes);
        }
    }

    private void trySendToSubscription(WebPushSubscription sub, byte[] payloadBytes) {
        try {
            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payloadBytes
            );
            pushService.send(notification);
            sub.setLastUsedAt(OffsetDateTime.now());
            subscriptionRepository.save(sub);
        } catch (Exception e) {
            handleSendError(sub, e);
        }
    }

    // Subscription hết hạn (410 Gone / 404 Not Found) → deactivate để tránh gửi tiếp
    private void handleSendError(WebPushSubscription sub, Exception e) {
        String message = e.getMessage();
        if (message != null && (message.contains("410") || message.contains("404"))) {
            sub.setIsActive(false);
            subscriptionRepository.save(sub);
            log.info("Subscription hết hạn, đã deactivate endpoint: {}", sub.getEndpoint());
        } else {
            log.error("Lỗi khi gửi Web Push đến endpoint {}: {}", sub.getEndpoint(), message);
        }
    }
}
