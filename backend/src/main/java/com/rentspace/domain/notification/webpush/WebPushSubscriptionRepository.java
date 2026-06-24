package com.rentspace.domain.notification.webpush;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebPushSubscriptionRepository extends JpaRepository<WebPushSubscription, Long> {

    List<WebPushSubscription> findAllByUserIdAndIsActiveTrue(Long userId);

    Optional<WebPushSubscription> findByEndpoint(String endpoint);
}
