package com.rentspace.domain.subscription;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.exception.SubscriptionLimitExceededException;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import org.aspectj.lang.JoinPoint;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionLimitAspectTest {

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private SubscriptionLimitAspect subscriptionLimitAspect;

    private User user;
    private SubscriptionPlan freePlan;
    private SubscriptionPlan proPlan;
    private UserSubscription activeFreeSub;
    private UserSubscription activeProSub;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("landlord@example.com")
                .build();

        freePlan = SubscriptionPlan.builder()
                .id(1)
                .name(com.rentspace.domain.subscription.enums.PlanName.FREE)
                .displayName("Miễn phí")
                .maxListings(10)
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(2)
                .name(com.rentspace.domain.subscription.enums.PlanName.SELLER_PRO_MONTHLY)
                .displayName("Seller Pro (Tháng)")
                .maxListings(50)
                .build();

        activeFreeSub = UserSubscription.builder()
                .id(1L)
                .user(user)
                .plan(freePlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        activeProSub = UserSubscription.builder()
                .id(2L)
                .user(user)
                .plan(proPlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();
    }

    @Test
    void checkListingLimit_WhenUnderLimit_ShouldPass() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"landlord@example.com"});

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(activeFreeSub));
        when(listingRepository.countByLandlordIdAndStatus(user.getId(), ListingStatus.ACTIVE)).thenReturn(5L); // 5/10

        assertDoesNotThrow(() -> subscriptionLimitAspect.checkListingLimit(joinPoint));

        verify(userRepository, times(1)).findByEmail("landlord@example.com");
        verify(userSubscriptionRepository, times(1)).findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE);
        verify(listingRepository, times(1)).countByLandlordIdAndStatus(user.getId(), ListingStatus.ACTIVE);
    }

    @Test
    void checkListingLimit_WhenReachLimit_ShouldThrowException() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"landlord@example.com"});

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(activeFreeSub));
        when(listingRepository.countByLandlordIdAndStatus(user.getId(), ListingStatus.ACTIVE)).thenReturn(10L); // 10/10 limit reached

        SubscriptionLimitExceededException exception = assertThrows(SubscriptionLimitExceededException.class,
                () -> subscriptionLimitAspect.checkListingLimit(joinPoint));

        assertTrue(exception.getMessage().contains("đạt tới giới hạn đăng tin tối đa"));
        assertTrue(exception.getMessage().contains("Miễn phí"));
        verify(listingRepository, times(1)).countByLandlordIdAndStatus(user.getId(), ListingStatus.ACTIVE);
    }

    @Test
    void checkListingLimit_WhenNoActiveSubscription_ShouldFallbackToFreeSubscription() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"landlord@example.com"});

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(subscriptionService.getOrCreateDefaultFreeSubscription(user)).thenReturn(activeFreeSub);
        when(listingRepository.countByLandlordIdAndStatus(user.getId(), ListingStatus.ACTIVE)).thenReturn(9L); // 9/10 under limit

        assertDoesNotThrow(() -> subscriptionLimitAspect.checkListingLimit(joinPoint));

        verify(subscriptionService, times(1)).getOrCreateDefaultFreeSubscription(user);
        verify(listingRepository, times(1)).countByLandlordIdAndStatus(user.getId(), ListingStatus.ACTIVE);
    }

    @Test
    void checkListingLimit_WhenUserNotFound_ShouldThrowException() {
        JoinPoint joinPoint = mock(JoinPoint.class);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"nonexistent@example.com"});

        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> subscriptionLimitAspect.checkListingLimit(joinPoint));

        verifyNoInteractions(userSubscriptionRepository);
        verifyNoInteractions(listingRepository);
    }
}
