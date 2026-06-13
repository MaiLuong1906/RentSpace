package com.rentspace.domain.listing;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.listing.dto.PromoteListingRequest;
import com.rentspace.domain.listing.dto.PromoteListingResponse;
import com.rentspace.domain.listing.dto.PromotedListingStatusResponse;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.infrastructure.payment.VnpayService;
import com.rentspace.infrastructure.payment.MomoGateway;
import com.rentspace.infrastructure.payment.PaymentGateway;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotedListingServiceTest {

    @Mock
    private PromotedListingRepository promotedListingRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VnpayService vnpayService;

    @Mock
    private MomoGateway momoGateway;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private NotificationService notificationService;

    private PromotedListingService promotedListingService;

    private User landlord;
    private Listing listing;
    private PromotedListing promotedListing;

    @BeforeEach
    void setUp() {
        lenient().when(vnpayService.getGatewayName()).thenReturn("VNPAY");
        lenient().when(momoGateway.getGatewayName()).thenReturn("MOMO");

        promotedListingService = new PromotedListingService(
                promotedListingRepository,
                listingRepository,
                userRepository,
                java.util.List.of(vnpayService, momoGateway),
                redisTemplate,
                notificationService
        );

        landlord = User.builder()
                .id(1L)
                .email("landlord@example.com")
                .fullName("Nguyen Van Landlord")
                .kycStatus(KycStatus.VERIFIED)
                .build();

        listing = Listing.builder()
                .id(10L)
                .landlord(landlord)
                .title("Phong tro quan 1")
                .status(ListingStatus.ACTIVE)
                .pricePerMonth(BigDecimal.valueOf(3000000))
                .build();

        promotedListing = PromotedListing.builder()
                .id(100L)
                .listing(listing)
                .landlord(landlord)
                .amountPaid(140000L) // 7 ngày * 20000L
                .isActive(false)
                .startsAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(7))
                .paymentRef("PROMOTE_100")
                .build();
    }

    @Test
    @DisplayName("Đẩy tin thành công - sinh URL thanh toán VNPay và lưu thông tin đẩy tin tạm thời")
    void createPromotionPayment_success() {
        PromoteListingRequest request = new PromoteListingRequest();
        request.setDurationDays(7);

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(promotedListingRepository.save(any(PromotedListing.class))).thenAnswer(i -> {
            PromotedListing p = i.getArgument(0);
            p.setId(100L);
            return p;
        });
        when(vnpayService.createPaymentUrl(eq(140000L), eq("PROMOTE_100"), anyString(), anyString()))
                .thenReturn("http://vnpay.vn/pay");

        PromoteListingResponse response = promotedListingService.createPromotionPayment(
                10L, "landlord@example.com", request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("http://vnpay.vn/pay", response.getPaymentUrl());
        assertEquals(140000L, response.getAmount());

        verify(promotedListingRepository, times(2)).save(any(PromotedListing.class));
    }

    @Test
    @DisplayName("Đẩy tin thất bại - Landlord chưa xác thực KYC")
    void createPromotionPayment_failed_kycNotVerified() {
        landlord.setKycStatus(KycStatus.PENDING);
        PromoteListingRequest request = new PromoteListingRequest();
        request.setDurationDays(7);

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));

        assertThrows(BusinessException.class, () -> promotedListingService.createPromotionPayment(
                10L, "landlord@example.com", request, "127.0.0.1"));

        verify(listingRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Đẩy tin thất bại - Người yêu cầu không phải chủ tin đăng")
    void createPromotionPayment_failed_notOwner() {
        User anotherLandlord = User.builder().id(2L).email("other@example.com").kycStatus(KycStatus.VERIFIED).build();
        PromoteListingRequest request = new PromoteListingRequest();
        request.setDurationDays(7);

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        listing.setLandlord(anotherLandlord);

        assertThrows(BusinessException.class, () -> promotedListingService.createPromotionPayment(
                10L, "landlord@example.com", request, "127.0.0.1"));
    }

    @Test
    @DisplayName("Đẩy tin thất bại - Tin đăng không hiển thị (ACTIVE)")
    void createPromotionPayment_failed_listingNotActive() {
        listing.setStatus(ListingStatus.PENDING);
        PromoteListingRequest request = new PromoteListingRequest();
        request.setDurationDays(7);

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));

        assertThrows(BusinessException.class, () -> promotedListingService.createPromotionPayment(
                10L, "landlord@example.com", request, "127.0.0.1"));
    }

    @Test
    @DisplayName("Lấy trạng thái tin nổi bật - Đang hoạt động")
    void getPromotionStatus_active() {
        when(promotedListingRepository.findByListingIdAndIsActiveTrue(10L))
                .thenReturn(Collections.singletonList(promotedListing));

        PromotedListingStatusResponse response = promotedListingService.getPromotionStatus(10L);

        assertTrue(response.getIsActive());
        assertNotNull(response.getExpiresAt());
    }

    @Test
    @DisplayName("Lấy trạng thái tin nổi bật - Không có tin nổi bật nào đang active")
    void getPromotionStatus_inactive() {
        when(promotedListingRepository.findByListingIdAndIsActiveTrue(10L))
                .thenReturn(Collections.emptyList());

        PromotedListingStatusResponse response = promotedListingService.getPromotionStatus(10L);

        assertFalse(response.getIsActive());
        assertNull(response.getExpiresAt());
    }

    @Test
    @DisplayName("Xử lý Webhook VNPay - Chữ ký số không hợp lệ")
    void processWebhook_invalidSignature() {
        Map<String, String> params = new HashMap<>();
        when(vnpayService.verifySignature(params)).thenReturn(false);

        Map<String, String> response = promotedListingService.processPromotedWebhook(params);

        assertEquals("97", response.get("RspCode"));
    }

    @Test
    @DisplayName("Xử lý Webhook VNPay - Trùng lặp sự kiện (Idempotency)")
    void processWebhook_idempotent() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "PROMOTE_100");

        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(redisTemplate.hasKey("webhook_processed:PROMOTE_100")).thenReturn(true);

        Map<String, String> response = promotedListingService.processPromotedWebhook(params);

        assertEquals("02", response.get("RspCode"));
    }

    @Test
    @DisplayName("Xử lý Webhook VNPay thành công - kích hoạt trạng thái boost và cập nhật hạn dùng")
    void processWebhook_success() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "PROMOTE_100");
        params.put("vnp_Amount", "14000000"); // 140000 * 100
        params.put("vnp_ResponseCode", "00");

        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(redisTemplate.hasKey("webhook_processed:PROMOTE_100")).thenReturn(false);
        when(promotedListingRepository.findById(100L)).thenReturn(Optional.of(promotedListing));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        Map<String, String> response = promotedListingService.processPromotedWebhook(params);

        assertEquals("00", response.get("RspCode"));
        assertTrue(promotedListing.getIsActive());
        verify(promotedListingRepository).save(promotedListing);
        verify(notificationService).createAndSendNotification(
                eq(landlord), anyString(), anyString(), eq(NotificationType.PAYMENT));
    }

    @Test
    @DisplayName("Đẩy tin thành công qua MoMo - sinh URL thanh toán MoMo và lưu thông tin đẩy tin tạm thời")
    void createPromotionPayment_momo_success() {
        PromoteListingRequest request = new PromoteListingRequest();
        request.setDurationDays(7);
        request.setMethod("MOMO");

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(listingRepository.findById(10L)).thenReturn(Optional.of(listing));
        when(promotedListingRepository.save(any(PromotedListing.class))).thenAnswer(i -> {
            PromotedListing p = i.getArgument(0);
            p.setId(100L);
            return p;
        });
        when(momoGateway.createPaymentUrl(eq(140000L), eq("PROMOTE_100"), anyString(), anyString()))
                .thenReturn("https://test-payment.momo.vn/pay");

        PromoteListingResponse response = promotedListingService.createPromotionPayment(
                10L, "landlord@example.com", request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("https://test-payment.momo.vn/pay", response.getPaymentUrl());
        assertEquals(140000L, response.getAmount());

        verify(promotedListingRepository, times(2)).save(any(PromotedListing.class));
    }

    @Test
    @DisplayName("Xử lý Webhook MoMo đẩy tin thành công - kích hoạt trạng thái boost và cập nhật hạn dùng")
    void processPromotedMomoWebhook_success() {
        Map<String, String> params = new HashMap<>();
        params.put("orderId", "PROMOTE_100");
        params.put("amount", "140000");
        params.put("resultCode", "0");
        params.put("transId", "MOMO123456");

        when(momoGateway.verifySignature(params)).thenReturn(true);
        when(redisTemplate.hasKey("webhook_processed:PROMOTE_100")).thenReturn(false);
        when(promotedListingRepository.findById(100L)).thenReturn(Optional.of(promotedListing));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        Map<String, Object> response = promotedListingService.processPromotedMomoWebhook(params);

        assertEquals(0, response.get("resultCode"));
        assertEquals("Success", response.get("message"));
        assertTrue(promotedListing.getIsActive());
        verify(promotedListingRepository).save(promotedListing);
        verify(notificationService).createAndSendNotification(
                eq(landlord), anyString(), anyString(), eq(NotificationType.PAYMENT));
    }
}
