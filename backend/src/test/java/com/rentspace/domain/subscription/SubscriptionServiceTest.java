package com.rentspace.domain.subscription;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.subscription.dto.SubscribeRequest;
import com.rentspace.domain.subscription.dto.SubscriptionPlanResponse;
import com.rentspace.domain.subscription.dto.UserSubscriptionResponse;
import com.rentspace.domain.subscription.enums.PlanName;
import com.rentspace.domain.subscription.enums.SubscriptionStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.infrastructure.payment.PaymentGateway;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionMapper subscriptionMapper;

    @Mock
    private PaymentGateway vnpayGateway;

    @Mock
    private PaymentGateway momoGateway;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ListingRepository listingRepository;

    private SubscriptionService subscriptionService;

    private User user;
    private SubscriptionPlan freePlan;
    private SubscriptionPlan proPlan;
    private UserSubscription currentSub;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("landlord@example.com")
                .fullName("Landlord A")
                .build();

        freePlan = SubscriptionPlan.builder()
                .id(1)
                .name(PlanName.FREE)
                .displayName("Miễn phí")
                .price(0L)
                .durationDays(0)
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(2)
                .name(PlanName.SELLER_PRO_MONTHLY)
                .displayName("Seller Pro Tháng")
                .price(99000L)
                .durationDays(30)
                .build();

        currentSub = UserSubscription.builder()
                .id(10L)
                .user(user)
                .plan(freePlan)
                .status(SubscriptionStatus.ACTIVE)
                .startedAt(LocalDateTime.now())
                .build();

        lenient().when(vnpayGateway.getGatewayName()).thenReturn("VNPAY");
        lenient().when(momoGateway.getGatewayName()).thenReturn("MOMO");

        subscriptionService = new SubscriptionService(
                subscriptionPlanRepository,
                userSubscriptionRepository,
                userRepository,
                subscriptionMapper,
                List.of(vnpayGateway, momoGateway),
                redisTemplate,
                notificationService,
                listingRepository
        );
    }

    @Test
    void getPricingPlans_ShouldReturnPlans() {
        when(subscriptionPlanRepository.findAll()).thenReturn(List.of(freePlan, proPlan));
        SubscriptionPlanResponse resp = new SubscriptionPlanResponse();
        when(subscriptionMapper.toResponse(any(SubscriptionPlan.class))).thenReturn(resp);

        List<SubscriptionPlanResponse> result = subscriptionService.getPricingPlans();

        assertEquals(2, result.size());
        verify(subscriptionPlanRepository, times(1)).findAll();
    }

    @Test
    void getCurrentSubscription_WhenExists_ShouldReturn() {
        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(currentSub));
        UserSubscriptionResponse.UserSubscriptionDetailResponse detailResp = new UserSubscriptionResponse.UserSubscriptionDetailResponse();
        when(subscriptionMapper.toDetailResponse(currentSub)).thenReturn(detailResp);
        when(listingRepository.countByLandlordIdAndStatusNot(user.getId(), ListingStatus.DELETED))
                .thenReturn(5L);

        UserSubscriptionResponse result = subscriptionService.getCurrentSubscription("landlord@example.com");

        assertNotNull(result);
        assertEquals(5L, result.getActiveListingCount());
    }

    @Test
    void getCurrentSubscription_WhenNotExists_ShouldCreateDefaultFree() {
        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.empty());
        when(subscriptionPlanRepository.findByName(PlanName.FREE)).thenReturn(Optional.of(freePlan));
        when(userSubscriptionRepository.save(any(UserSubscription.class))).thenReturn(currentSub);
        UserSubscriptionResponse.UserSubscriptionDetailResponse detailResp = new UserSubscriptionResponse.UserSubscriptionDetailResponse();
        when(subscriptionMapper.toDetailResponse(any(UserSubscription.class))).thenReturn(detailResp);
        when(listingRepository.countByLandlordIdAndStatusNot(user.getId(), ListingStatus.DELETED))
                .thenReturn(0L);

        UserSubscriptionResponse result = subscriptionService.getCurrentSubscription("landlord@example.com");

        assertNotNull(result);
        verify(userSubscriptionRepository, times(1)).save(any(UserSubscription.class));
    }

    @Test
    void createUpgradePayment_WithFreePlan_ShouldActivateImmediately() {
        SubscribeRequest req = new SubscribeRequest();
        req.setPlanId(1); // FREE

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findById(1)).thenReturn(Optional.of(freePlan));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(currentSub));

        String result = subscriptionService.createUpgradePayment("landlord@example.com", req, "VNPAY", "127.0.0.1");

        assertEquals("FREE_ACTIVATED", result);
        verify(userSubscriptionRepository, times(2)).save(any(UserSubscription.class)); // 1 for expire old, 1 for free active
    }

    @Test
    void createUpgradePayment_WithPaidPlan_ShouldReturnPaymentUrl() {
        SubscribeRequest req = new SubscribeRequest();
        req.setPlanId(2); // PRO

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findById(2)).thenReturn(Optional.of(proPlan));
        when(vnpayGateway.createPaymentUrl(eq(99000L), anyString(), eq("Dang ky goi Seller Pro Thang"), eq("127.0.0.1")))
                .thenReturn("http://vnpay.com/pay");

        String result = subscriptionService.createUpgradePayment("landlord@example.com", req, "VNPAY", "127.0.0.1");

        assertEquals("http://vnpay.com/pay", result);
    }

    @Test
    void processVnpayWebhook_InvalidSignature_ShouldReturnError() {
        Map<String, String> params = new HashMap<>();
        when(vnpayGateway.verifySignature(params)).thenReturn(false);

        Map<String, String> response = subscriptionService.processVnpayWebhook(params);

        assertEquals("97", response.get("RspCode"));
    }

    @Test
    void processVnpayWebhook_OrderNotFound_ShouldReturnError() {
        Map<String, String> params = Map.of("vnp_TxnRef", "SUB_1_2_12345");
        when(vnpayGateway.verifySignature(params)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        Map<String, String> response = subscriptionService.processVnpayWebhook(params);

        assertEquals("01", response.get("RspCode"));
    }

    @Test
    void processVnpayWebhook_PaymentSuccess_ShouldActivate() {
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "SUB_1_2_12345",
                "vnp_Amount", "9900000",
                "vnp_ResponseCode", "00",
                "vnp_TransactionNo", "TRANS123"
        );
        when(vnpayGateway.verifySignature(params)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findById(2)).thenReturn(Optional.of(proPlan));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(currentSub));
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(mock(ValueOperations.class));

        Map<String, String> response = subscriptionService.processVnpayWebhook(params);

        assertEquals("00", response.get("RspCode"));
        verify(userSubscriptionRepository, times(2)).save(any(UserSubscription.class)); // 1 expired, 1 active pro
    }

    @Test
    void processMomoWebhook_PaymentSuccess_ShouldActivate() {
        Map<String, String> params = Map.of(
                "orderId", "SUB_1_2_12345",
                "amount", "99000",
                "resultCode", "0",
                "transId", "MOMO123"
        );
        when(momoGateway.verifySignature(params)).thenReturn(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(subscriptionPlanRepository.findById(2)).thenReturn(Optional.of(proPlan));
        when(userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(currentSub));
        when(redisTemplate.hasKey(anyString())).thenReturn(false);
        when(redisTemplate.opsForValue()).thenReturn(mock(ValueOperations.class));

        Map<String, Object> response = subscriptionService.processMomoWebhook(params);

        assertEquals(0, response.get("resultCode"));
        verify(userSubscriptionRepository, times(2)).save(any(UserSubscription.class));
    }
}
