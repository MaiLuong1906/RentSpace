package com.rentspace.domain.subscription;

import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.subscription.enums.PlanName;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import com.rentspace.domain.user.User;
import com.rentspace.infrastructure.email.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionExpirySchedulerTest {

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private SubscriptionExpiryScheduler subscriptionExpiryScheduler;

    private User user;
    private SubscriptionPlan proPlan;
    private UserSubscription expiredSub;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("landlord@example.com")
                .fullName("Nguyen Van Landlord")
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(2)
                .name(PlanName.SELLER_PRO_MONTHLY)
                .displayName("Seller Pro (Tháng)")
                .build();

        expiredSub = UserSubscription.builder()
                .id(100L)
                .user(user)
                .plan(proPlan)
                .status(SubscriptionStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Test
    void checkExpiredSubscriptions_NoExpired_ShouldDoNothing() {
        when(userSubscriptionRepository.findAllByStatusAndExpiresAtBefore(eq(SubscriptionStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        subscriptionExpiryScheduler.checkExpiredSubscriptions();

        verify(userSubscriptionRepository, times(1))
                .findAllByStatusAndExpiresAtBefore(eq(SubscriptionStatus.ACTIVE), any(LocalDateTime.class));
        verify(userSubscriptionRepository, never()).save(any());
        verifyNoInteractions(subscriptionService);
        verifyNoInteractions(notificationService);
        verifyNoInteractions(emailService);
    }

    @Test
    void checkExpiredSubscriptions_HasExpired_ShouldUpdateAndNotify() {
        when(userSubscriptionRepository.findAllByStatusAndExpiresAtBefore(eq(SubscriptionStatus.ACTIVE), any(LocalDateTime.class)))
                .thenReturn(List.of(expiredSub));

        subscriptionExpiryScheduler.checkExpiredSubscriptions();

        verify(userSubscriptionRepository, times(1)).save(expiredSub);
        verify(subscriptionService, times(1)).getOrCreateDefaultFreeSubscription(user);
        verify(notificationService, times(1)).createAndSendNotification(
                eq(user),
                eq("Gói hội viên đã hết hạn"),
                contains("Gói hội viên Seller Pro (Tháng) của bạn đã hết hạn"),
                eq(NotificationType.SYSTEM)
        );
        verify(emailService, times(1)).sendSubscriptionExpiredEmail(
                eq("landlord@example.com"),
                eq("Nguyen Van Landlord"),
                eq("Seller Pro (Tháng)")
        );
    }
}
