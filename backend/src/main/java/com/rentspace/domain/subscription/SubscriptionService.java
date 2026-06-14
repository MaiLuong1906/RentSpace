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
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.infrastructure.payment.PaymentGateway;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubscriptionService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;
    private final SubscriptionMapper subscriptionMapper;
    private final List<PaymentGateway> paymentGateways;
    private final StringRedisTemplate redisTemplate;
    private final NotificationService notificationService;
    private final ListingRepository listingRepository;

    public List<SubscriptionPlanResponse> getPricingPlans() {
        return subscriptionPlanRepository.findAll().stream()
                .map(subscriptionMapper::toResponse)
                .collect(Collectors.toList());
    }

    public LocalDateTime getCurrentCycleStartDate(LocalDateTime startedAt) {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startedAt)) {
            return startedAt;
        }
        long monthsBetween = java.time.temporal.ChronoUnit.MONTHS.between(startedAt, now);
        LocalDateTime cycleStart = startedAt.plusMonths(monthsBetween);
        if (cycleStart.isAfter(now)) {
            cycleStart = cycleStart.minusMonths(1);
        }
        return cycleStart;
    }

    @Transactional
    public UserSubscriptionResponse getCurrentSubscription(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        UserSubscription activeSub = userSubscriptionRepository
                .findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE)
                .orElseGet(() -> getOrCreateDefaultFreeSubscription(user));

        long activeListingCount;
        if (activeSub.getPlan().getName() == PlanName.FREE) {
            activeListingCount = listingRepository.countByLandlordIdAndStatusNot(user.getId(), ListingStatus.DELETED);
        } else {
            LocalDateTime cycleStart = getCurrentCycleStartDate(activeSub.getStartedAt());
            activeListingCount = listingRepository.countByLandlordIdAndStatusNotAndCreatedAtGreaterThanEqual(
                    user.getId(), ListingStatus.DELETED, cycleStart);
        }
        boolean limitReached = activeListingCount >= activeSub.getPlan().getMaxListings();

        return UserSubscriptionResponse.builder()
                .subscription(subscriptionMapper.toDetailResponse(activeSub))
                .activeListingCount(activeListingCount)
                .limitReached(limitReached)
                .build();
    }

    @Transactional
    public String createUpgradePayment(String email, SubscribeRequest request, String method, String ipAddress) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Gói cước không tồn tại"));

        // Nếu là gói FREE (0đ)
        if (plan.getPrice() == 0) {
            activateFreePlan(user, plan);
            return "FREE_ACTIVATED";
        }

        // Tạo mã đơn hàng độc nhất: SUB_<userId>_<planId>_<timestamp>
        String orderId = String.format("SUB_%d_%d_%d", user.getId(), plan.getId(), System.currentTimeMillis());

        PaymentGateway gateway = getGateway(method);
        String orderInfo = sanitizeOrderInfo("Dang ky goi " + plan.getDisplayName());

        log.info("Khởi tạo yêu cầu nâng cấp gói cước: userId={}, planId={}, price={}", user.getId(), plan.getId(), plan.getPrice());

        return gateway.createPaymentUrl(plan.getPrice(), orderId, orderInfo, ipAddress);
    }

    @Transactional
    public void activateFreePlan(User user, SubscriptionPlan freePlan) {
        // Hủy gói cước ACTIVE cũ
        userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE)
                .ifPresent(oldSub -> {
                    oldSub.setStatus(SubscriptionStatus.EXPIRED);
                    userSubscriptionRepository.save(oldSub);
                });

        UserSubscription freeSub = UserSubscription.builder()
                .user(user)
                .plan(freePlan)
                .status(SubscriptionStatus.ACTIVE)
                .startedAt(LocalDateTime.now())
                .expiresAt(null) // vĩnh viễn
                .autoRenew(false)
                .build();

        userSubscriptionRepository.save(freeSub);
        log.info("Kích hoạt gói FREE cho user {}", user.getId());
    }

    @Transactional
    public Map<String, String> processVnpayWebhook(Map<String, String> params) {
        log.info("Processing Subscription VNPay Webhook: {}", params);

        PaymentGateway gateway = getGateway("VNPAY");
        if (!gateway.verifySignature(params)) {
            log.error("Invalid VNPay signature for subscription webhook");
            return Map.of("RspCode", "97", "Message", "Invalid Checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || !txnRef.startsWith("SUB_")) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        String redisKey = "webhook_processed:" + txnRef;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            log.info("Webhook for subscription {} was already processed", txnRef);
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        // Parse: SUB_<userId>_<planId>_<timestamp>
        String[] parts = txnRef.split("_");
        if (parts.length < 3) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        Long userId = Long.parseLong(parts[1]);
        Integer planId = Integer.parseInt(parts[2]);

        User user = userRepository.findById(userId).orElse(null);
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId).orElse(null);

        if (user == null || plan == null) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // Check amount
        String vnpAmountStr = params.get("vnp_Amount");
        if (vnpAmountStr == null || vnpAmountStr.isEmpty()) {
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        long vnpAmount = Long.parseLong(vnpAmountStr) / 100;
        if (vnpAmount != plan.getPrice()) {
            log.error("Amount mismatch for subscription: Expected {}, Got {}", plan.getPrice(), vnpAmount);
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        if ("00".equals(responseCode)) {
            executeSubscriptionActivation(user, plan, transactionNo);
        } else {
            log.warn("Subscription payment failed for user {} plan {} with code {}", userId, planId, responseCode);
        }

        redisTemplate.opsForValue().set(redisKey, "1", 7, TimeUnit.DAYS);
        return Map.of("RspCode", "00", "Message", "Confirm Success");
    }

    @Transactional
    public Map<String, Object> processMomoWebhook(Map<String, String> params) {
        log.info("Processing Subscription MoMo Webhook: {}", params);

        PaymentGateway gateway = getGateway("MOMO");
        if (!gateway.verifySignature(params)) {
            log.error("Invalid MoMo signature for subscription webhook");
            return Map.of("resultCode", 98, "message", "Invalid Signature");
        }

        String orderId = params.get("orderId");
        if (orderId == null || !orderId.startsWith("SUB_")) {
            return Map.of("resultCode", 96, "message", "Order not found");
        }

        String redisKey = "webhook_processed:" + orderId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            return Map.of("resultCode", 0, "message", "Order already confirmed");
        }

        String[] parts = orderId.split("_");
        if (parts.length < 3) {
            return Map.of("resultCode", 96, "message", "Order not found");
        }

        Long userId = Long.parseLong(parts[1]);
        Integer planId = Integer.parseInt(parts[2]);

        User user = userRepository.findById(userId).orElse(null);
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId).orElse(null);

        if (user == null || plan == null) {
            return Map.of("resultCode", 96, "message", "Order not found");
        }

        String amountStr = params.get("amount");
        if (amountStr == null || amountStr.isEmpty()) {
            return Map.of("resultCode", 95, "message", "Invalid Amount");
        }

        long amount = Long.parseLong(amountStr);
        if (amount != plan.getPrice()) {
            log.error("Amount mismatch for subscription (MoMo): Expected {}, Got {}", plan.getPrice(), amount);
            return Map.of("resultCode", 95, "message", "Invalid Amount");
        }

        String resultCode = params.get("resultCode");
        String transId = params.get("transId");

        if ("0".equals(resultCode)) {
            executeSubscriptionActivation(user, plan, transId);
        } else {
            log.warn("Subscription MoMo payment failed for user {} plan {} with code {}", userId, planId, resultCode);
        }

        redisTemplate.opsForValue().set(redisKey, "1", 7, TimeUnit.DAYS);
        return Map.of("resultCode", 0, "message", "Confirm Success");
    }

    private void executeSubscriptionActivation(User user, SubscriptionPlan plan, String paymentRef) {
        // Hủy gói cước cũ đang active
        userSubscriptionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(user.getId(), SubscriptionStatus.ACTIVE)
                .ifPresent(oldSub -> {
                    oldSub.setStatus(SubscriptionStatus.EXPIRED);
                    userSubscriptionRepository.save(oldSub);
                });

        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .status(SubscriptionStatus.ACTIVE)
                .startedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(plan.getDurationDays()))
                .paymentRef(paymentRef)
                .autoRenew(false)
                .build();

        userSubscriptionRepository.save(newSub);
        log.info("Kích hoạt thành công gói {} cho user {}. Hạn dùng: {}", plan.getDisplayName(), user.getId(), newSub.getExpiresAt());

        // Gửi thông báo
        try {
            notificationService.createAndSendNotification(
                    user,
                    "Nâng cấp gói hội viên thành công",
                    "Chúc mừng! Bạn đã nâng cấp thành công gói \"" + plan.getDisplayName() + "\". Hạn dùng đến " + newSub.getExpiresAt(),
                    NotificationType.PAYMENT
            );
        } catch (Exception e) {
            log.error("Failed to send subscription activation notification", e);
        }
    }

    @Transactional
    public UserSubscription getOrCreateDefaultFreeSubscription(User user) {
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByName(PlanName.FREE)
                .orElseGet(() -> subscriptionPlanRepository.save(
                        SubscriptionPlan.builder()
                                .name(PlanName.FREE)
                                .displayName("Miễn phí")
                                .price(0L)
                                .durationDays(0)
                                .maxListings(10)
                                .maxImages(5)
                                .boostCredits(0)
                                .analyticsLevel(com.rentspace.domain.subscription.enums.AnalyticsLevel.BASIC)
                                .build()
                ));

        UserSubscription freeSub = UserSubscription.builder()
                .user(user)
                .plan(freePlan)
                .status(SubscriptionStatus.ACTIVE)
                .startedAt(LocalDateTime.now())
                .expiresAt(null)
                .autoRenew(false)
                .build();

        return userSubscriptionRepository.save(freeSub);
    }

    private PaymentGateway getGateway(String method) {
        return paymentGateways.stream()
                .filter(g -> g.getGatewayName().equalsIgnoreCase(method))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Cổng thanh toán không hỗ trợ: " + method));
    }

    private String sanitizeOrderInfo(String input) {
        if (input == null) return "";
        String temp = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String out = pattern.matcher(temp).replaceAll("")
                .replace("đ", "d")
                .replace("Đ", "D");
        return out.replaceAll("[^a-zA-Z0-9\\s_]", "").trim();
    }
}
