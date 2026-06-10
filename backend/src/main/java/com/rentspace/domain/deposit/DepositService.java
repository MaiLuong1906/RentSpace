package com.rentspace.domain.deposit;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.deposit.dto.DepositRequest;
import com.rentspace.domain.deposit.dto.DepositResponse;
import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.infrastructure.payment.VnpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepositService {

    private final DepositTransactionRepository depositRepository;
    private final DepositTransactionEventRepository eventRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final VnpayService vnpayService;
    private final DepositMapper depositMapper;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final com.rentspace.domain.notification.NotificationService notificationService;
    private final com.rentspace.infrastructure.email.EmailService emailService;

    private static final double PLATFORM_FEE_PERCENT = 0.02; // 2%
    private static final long MAX_PLATFORM_FEE = 100000L; // 100,000 VND

    @Transactional
    public Map<String, String> processVnpayWebhook(Map<String, String> params) {
        log.info("Processing VNPay Webhook with params: {}", params);

        // 1. Verify Signature
        if (!vnpayService.verifySignature(params)) {
            log.error("Invalid VNPay signature for webhook");
            return Map.of("RspCode", "97", "Message", "Invalid Checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isEmpty()) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        String redisKey = "webhook_processed:" + txnRef;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            log.info("Webhook for transaction {} was already processed (Redis cache hit)", txnRef);
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        Long depositId;
        try {
            depositId = Long.parseLong(txnRef);
        } catch (NumberFormatException e) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        DepositTransaction transaction = depositRepository.findById(depositId).orElse(null);
        if (transaction == null) {
            return Map.of("RspCode", "01", "Message", "Order not found");
        }

        // 2. Check Idempotency (Already processed?)
        if (transaction.getStatus() != DepositStatus.PENDING_PAYMENT) {
            log.info("Transaction {} already processed with status {}", depositId, transaction.getStatus());
            return Map.of("RspCode", "02", "Message", "Order already confirmed");
        }

        // 3. Check Amount (Tampering protection)
        // VNPay amount is multiplied by 100
        String vnpAmountStr = params.get("vnp_Amount");
        if (vnpAmountStr == null || vnpAmountStr.isEmpty()) {
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        long vnpAmount = Long.parseLong(vnpAmountStr) / 100;
        if (vnpAmount != transaction.getAmount()) {
            log.error("Amount mismatch for transaction {}: Expected {}, Got {}", depositId, transaction.getAmount(), vnpAmount);
            logEvent(transaction, "PAYMENT_FAILED", null, "Số tiền không khớp. Mong đợi: " + transaction.getAmount() + ", Nhận được: " + vnpAmount);
            return Map.of("RspCode", "04", "Message", "Invalid Amount");
        }

        // 4. Update Status based on Response Code
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        if ("00".equals(responseCode)) {
            transaction.setStatus(DepositStatus.PAID);
            transaction.setPaidAt(LocalDateTime.now());
            transaction.setPaymentGatewayRef(transactionNo);
            // Set default release deadline (e.g., 7 days after move-in)
            if (transaction.getMoveInDate() != null) {
                transaction.setReleaseDeadline(transaction.getMoveInDate().atStartOfDay().plusDays(7));
            } else {
                transaction.setReleaseDeadline(LocalDateTime.now().plusDays(10));
            }
            
            log.info("Transaction {} marked as PAID", depositId);
            logEvent(transaction, "PAYMENT_SUCCESS", null, "Thanh toán thành công qua VNPay. Ref: " + transactionNo);
            
            // Send PAID notifications
            try {
                // Notify Tenant
                notificationService.createAndSendNotification(
                        transaction.getTenant(),
                        "Thanh toán đặt cọc thành công",
                        "Bạn đã thanh toán đặt cọc thành công cho tin đăng \"" + transaction.getListing().getTitle() + "\".",
                        com.rentspace.domain.notification.enums.NotificationType.PAYMENT
                );
                // Email Tenant
                emailService.sendDepositPaidEmail(
                        transaction.getTenant().getEmail(),
                        transaction.getTenant().getFullName(),
                        transaction.getListing().getTitle(),
                        transaction.getAmount(),
                        false
                );
                
                // Notify Landlord
                notificationService.createAndSendNotification(
                        transaction.getLandlord(),
                        "Đã nhận tiền đặt cọc giữ chỗ",
                        "Người thuê đã thanh toán đặt cọc thành công cho tin đăng \"" + transaction.getListing().getTitle() + "\". Tiền cọc đang được giữ hộ (Escrow).",
                        com.rentspace.domain.notification.enums.NotificationType.PAYMENT
                );
                // Email Landlord
                emailService.sendDepositPaidEmail(
                        transaction.getLandlord().getEmail(),
                        transaction.getLandlord().getFullName(),
                        transaction.getListing().getTitle(),
                        transaction.getAmount(),
                        true
                );
            } catch (Exception e) {
                log.error("Failed to send payment success notifications", e);
            }
        } else {
            transaction.setStatus(DepositStatus.CANCELLED);
            log.warn("Transaction {} payment failed with code {}", depositId, responseCode);
            logEvent(transaction, "PAYMENT_FAILED", null, "Thanh toán thất bại với mã: " + responseCode);
        }

        depositRepository.save(transaction);
        
        // Save to Redis to prevent double processing
        redisTemplate.opsForValue().set(redisKey, "1", 7, java.util.concurrent.TimeUnit.DAYS);
        
        return Map.of("RspCode", "00", "Message", "Confirm Success");
    }

    @Transactional
    public DepositResponse createDeposit(DepositRequest request, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        Listing listing = listingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("Tin đăng không tồn tại"));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BusinessException("Tin đăng không khả dụng để đặt cọc");
        }

        if (listing.getLandlord().getId().equals(currentUser.getId())) {
            throw new BusinessException("Bạn không thể đặt cọc trên tin đăng của chính mình");
        }

        // Validate that no PAID or DISPUTED deposit exists for this listing + tenant
        java.util.List<DepositStatus> activeStatuses = java.util.List.of(DepositStatus.PAID, DepositStatus.DISPUTED);
        if (depositRepository.existsByListingIdAndTenantIdAndStatusIn(listing.getId(), currentUser.getId(), activeStatuses)) {
            throw new BusinessException("Bạn đã có giao dịch đặt cọc đang hoạt động hoặc tranh chấp cho tin đăng này");
        }

        // Calculate fees
        long amount = request.getAmount();
        long platformFee = Math.min((long) (amount * PLATFORM_FEE_PERCENT), MAX_PLATFORM_FEE);
        long netAmount = amount - platformFee;

        DepositTransaction transaction = DepositTransaction.builder()
                .listing(listing)
                .tenant(currentUser)
                .landlord(listing.getLandlord())
                .amount(amount)
                .platformFee(platformFee)
                .netAmount(netAmount)
                .status(DepositStatus.PENDING_PAYMENT)
                .moveInDate(request.getMoveInDate())
                .notes(request.getNotes())
                .build();

        transaction = depositRepository.save(transaction);

        // Log event
        logEvent(transaction, "CREATED", currentUser, "Yêu cầu đặt cọc được tạo");

        // Send notifications
        try {
            // Notify Landlord
            notificationService.createAndSendNotification(
                    transaction.getLandlord(),
                    "Yêu cầu đặt cọc mới",
                    "Bạn nhận được một yêu cầu đặt cọc mới từ " + currentUser.getFullName() + " cho tin đăng \"" + listing.getTitle() + "\".",
                    com.rentspace.domain.notification.enums.NotificationType.DEPOSIT
            );
            // Email Landlord
            emailService.sendDepositCreatedEmail(
                    transaction.getLandlord().getEmail(),
                    transaction.getLandlord().getFullName(),
                    listing.getTitle(),
                    amount
            );
        } catch (Exception e) {
            log.error("Failed to send deposit created notifications", e);
        }

        return depositMapper.toResponse(transaction);
    }

    @Transactional
    public String initiatePayment(Long depositId, String ipAddress, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        DepositTransaction transaction = depositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch đặt cọc không tồn tại"));

        if (!transaction.getTenant().getId().equals(currentUser.getId())) {
            throw new BusinessException("Bạn không có quyền thanh toán cho giao dịch này");
        }

        if (transaction.getStatus() != DepositStatus.PENDING_PAYMENT) {
            throw new BusinessException("Giao dịch không ở trạng thái CHỜ THANH TOÁN");
        }

        String paymentUrl = vnpayService.createPaymentUrl(transaction.getAmount(), transaction.getId().toString(), ipAddress);
        
        transaction.setPaymentUrl(paymentUrl);
        transaction.setPaymentMethod("VNPAY");
        depositRepository.save(transaction);

        return paymentUrl;
    }

    public List<DepositResponse> getMyDeposits(String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        // As a tenant or landlord
        return depositRepository.findAllByTenantIdOrLandlordIdOrderByCreatedAtDesc(currentUser.getId(), currentUser.getId())
                .stream()
                .map(depositMapper::toResponse)
                .collect(Collectors.toList());
    }

    public DepositResponse getDepositById(Long id, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        DepositTransaction transaction = depositRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch đặt cọc không tồn tại"));

        if (!transaction.getTenant().getId().equals(currentUser.getId()) && 
            !transaction.getLandlord().getId().equals(currentUser.getId())) {
            throw new BusinessException("Bạn không có quyền truy cập giao dịch này");
        }

        return depositMapper.toResponse(transaction);
    }

    private void logEvent(DepositTransaction transaction, String eventType, User actor, String description) {
        DepositTransactionEvent event = DepositTransactionEvent.builder()
                .transaction(transaction)
                .eventType(eventType)
                .actor(actor)
                .description(description)
                .build();
        eventRepository.save(event);
    }
}
