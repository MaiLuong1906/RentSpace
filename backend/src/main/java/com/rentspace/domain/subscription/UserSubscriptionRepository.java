package com.rentspace.domain.subscription;

import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    Optional<UserSubscription> findFirstByUserIdAndStatusOrderByStartedAtDesc(Long userId, SubscriptionStatus status);
    
    List<UserSubscription> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<UserSubscription> findAllByStatusAndExpiresAtBefore(SubscriptionStatus status, LocalDateTime dateTime);
}
