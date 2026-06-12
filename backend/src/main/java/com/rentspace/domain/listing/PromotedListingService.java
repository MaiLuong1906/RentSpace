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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PromotedListingService {

    private final PromotedListingRepository promotedListingRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final VnpayService vnpayService;
    private final StringRedisTemplate redisTemplate;
    private final NotificationService notificationService;

    private static final long PRICE_PER_DAY = 20000L; // 20,000 VND / ngày

    @Transactional
    public PromoteListingResponse createPromotionPayment(Long listingId, String email, PromoteListingRequest request, String ipAddress) {
        User landlord = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        // 1. Kiểm tra KYC
        if (landlord.getKycStatus() != KycStatus.VERIFIED) {
            throw new BusinessException("Bạn cần hoàn thành xác thực danh tính (KYC) để sử dụng tính năng này");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin đăng"));

        // 2. Kiểm tra quyền sở hữu
        if (!listing.getLandlord().getId().equals(landlord.getId())) {
            throw new BusinessException("Bạn không có quyền quảng bá tin đăng này");
        }

        // 3. Kiểm tra trạng thái tin
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BusinessException("Chỉ những tin đăng đang hiển thị (ACTIVE) mới được phép boost tin");
        }

        // 4. Tính tiền
        long amount = PRICE_PER_DAY * request.getDurationDays();

        // 5. Tạo bản ghi PromotedListing ở trạng thái chưa kích hoạt (isActive = false)
        PromotedListing promoted = PromotedListing.builder()
                .listing(listing)
                .landlord(landlord)
                .amountPaid(amount)
                .expiresAt(LocalDateTime.now().plusDays(request.getDurationDays())) // Tạm thời
                .isActive(false)
                .build();

        promoted = promotedListingRepository.save(promoted);

        // 6. Tạo vnp_TxnRef
        String txnRef = "PROMOTE_" + promoted.getId();
        promoted.setPaymentRef(txnRef);
        promotedListingRepository.save(promoted);

        // 7. Tạo URL thanh toán VNPay
        String orderInfo = "Day tin noi bat phong: " + listing.getTitle();
        String paymentUrl = vnpayService.createPaymentUrl(amount, txnRef, orderInfo, ipAddress);

        log.info("Khởi tạo yêu cầu đẩy tin thành công: listingId={}, durationDays={}, amount={}", listingId, request.getDurationDays(), amount);

        return PromoteListingResponse.builder()
                .paymentUrl(paymentUrl)
                .amount(amount)
                .build();
    }

    public PromotedListingStatusResponse getPromotionStatus(Long listingId) {
        // Tìm bản ghi đang hoạt động
        List<PromotedListing> activePromotions = promotedListingRepository.findByListingIdAndIsActiveTrue(listingId);
        Optional<PromotedListing> currentActive = activePromotions.stream()
                .filter(p -> p.getExpiresAt() != null && p.getExpiresAt().isAfter(LocalDateTime.now()))
                .findFirst();

        if (currentActive.isPresent()) {
            PromotedListing p = currentActive.get();
            return PromotedListingStatusResponse.builder()
                    .isActive(true)
                    .startsAt(p.getStartsAt())
                    .expiresAt(p.getExpiresAt())
                    .build();
        }

        return PromotedListingStatusResponse.builder()
                .isActive(false)
                .build();
        }

    @Transactional
    public Map<String, String> processPromotedWebhook(Map<String, String> params) {
        log.info("Processing Promoted Webhook with params: {}", params);

        // 1. Verify Signature
        if (!vnpayService.verifySignature(params)) {
            log.error("Invalid VNPay signature for promote webhook");
            return Map.of("RspCode", "97", "Message", "Invalid Checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || !txnRef.startsWith("PROMOTE_")) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // 2. Check Idempotency (Already processed?)
        String redisKey = "webhook_processed:" + txnRef;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            log.info("Webhook for promotion {} was already processed (Redis cache hit)", txnRef);
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        Long promotedId;
        try {
            promotedId = Long.parseLong(txnRef.replace("PROMOTE_", ""));
        } catch (NumberFormatException e) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        PromotedListing promoted = promotedListingRepository.findById(promotedId).orElse(null);
        if (promoted == null) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        if (Boolean.TRUE.equals(promoted.getIsActive())) {
            log.info("Promotion {} already activated", promotedId);
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        // 3. Check Amount
        String vnpAmountStr = params.get("vnp_Amount");
        if (vnpAmountStr == null || vnpAmountStr.isEmpty()) {
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        long vnpAmount = Long.parseLong(vnpAmountStr) / 100;
        if (vnpAmount != promoted.getAmountPaid()) {
            log.error("Amount mismatch for promotion {}: Expected {}, Got {}", promotedId, promoted.getAmountPaid(), vnpAmount);
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        // 4. Update Status
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            promoted.setIsActive(true);
            long durationDays = promoted.getAmountPaid() / PRICE_PER_DAY;
            promoted.setExpiresAt(LocalDateTime.now().plusDays(durationDays));
            promotedListingRepository.save(promoted);

            log.info("Promotion {} marked as ACTIVE. Expires at {}", promotedId, promoted.getExpiresAt());

            // Gửi thông báo cho chủ nhà
            try {
                notificationService.createAndSendNotification(
                        promoted.getLandlord(),
                        "Đẩy tin nổi bật thành công",
                        "Tin đăng \"" + promoted.getListing().getTitle() + "\" của bạn đã được đẩy lên nổi bật trong " + durationDays + " ngày.",
                        NotificationType.PAYMENT
                );
            } catch (Exception e) {
                log.error("Failed to send promotion success notification", e);
            }
        } else {
            promoted.setIsActive(false);
            promotedListingRepository.save(promoted);
            log.warn("Promotion payment {} failed with code {}", promotedId, responseCode);
        }

        // Lưu Redis chặn trùng lặp
        redisTemplate.opsForValue().set(redisKey, "1", 7, TimeUnit.DAYS);

        return Map.of("RspCode", "00", "Message", "Confirm Success");
    }
}
