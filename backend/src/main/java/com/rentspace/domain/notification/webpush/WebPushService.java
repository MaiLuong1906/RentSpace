package com.rentspace.domain.notification.webpush;

import com.rentspace.domain.notification.webpush.dto.WebPushPayload;
import com.rentspace.domain.notification.webpush.dto.WebPushSubscribeRequest;

public interface WebPushService {

    void subscribe(Long userId, WebPushSubscribeRequest request);

    void unsubscribe(String endpoint);

    void sendToUser(Long userId, WebPushPayload payload);
}
