package com.rentspace.domain.deposit;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.deposit.dto.DepositRequest;
import com.rentspace.domain.deposit.dto.DepositResponse;
import com.rentspace.domain.deposit.dto.LandlordDepositSummary;
import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.listing.ListingRepository;
import com.rentspace.domain.listing.enums.ListingStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.infrastructure.payment.VnpayService;
import com.rentspace.infrastructure.payment.MomoGateway;
import com.rentspace.infrastructure.payment.PaymentGateway;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.rentspace.domain.deposit.dto.DisputeResponse;
import com.rentspace.domain.user.enums.Role;
import com.rentspace.domain.deposit.enums.DisputeReason;
import com.rentspace.domain.deposit.enums.DisputeStatus;
import org.springframework.scheduling.annotation.Scheduled;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepositService {

    private final DepositTransactionRepository depositRepository;
    private final DepositTransactionEventRepository eventRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final List<PaymentGateway> paymentGateways;
    private final DepositMapper depositMapper;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final com.rentspace.domain.notification.NotificationService notificationService;
    private final com.rentspace.infrastructure.email.EmailService emailService;
    private final DepositDisputeRepository disputeRepository;
    private final com.rentspace.domain.contract.RentalContractService rentalContractService;
    private final com.rentspace.domain.payout.PayoutService payoutService;

    private static final double PLATFORM_FEE_PERCENT = 0.02; // 2%
    private static final long MAX_PLATFORM_FEE = 100000L; // 100,000 VND


    @Transactional
    public Map<String, String> processVnpayWebhook(Map<String, String> params) {
        log.info("Processing VNPay Webhook with params: {}", params);

        // 1. Verify Signature
        PaymentGateway gateway = getGateway("VNPAY");
        if (!gateway.verifySignature(params)) {
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
    public Map<String, Object> processMomoWebhook(Map<String, String> params) {
        log.info("Processing MoMo Webhook with params: {}", params);

        // 1. Verify Signature
        PaymentGateway gateway = getGateway("MOMO");
        if (!gateway.verifySignature(params)) {
            log.error("Invalid MoMo signature for webhook");
            return Map.of("resultCode", 98, "message", "Invalid Signature");
        }

        String orderId = params.get("orderId");
        if (orderId == null || orderId.isEmpty()) {
            return Map.of("resultCode", 99, "message", "Order not found");
        }

        String redisKey = "webhook_processed:momo:" + orderId;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(redisKey))) {
            log.info("Webhook for MoMo transaction {} was already processed (Redis cache hit)", orderId);
            return Map.of("resultCode", 0, "message", "Order already confirmed");
        }

        Long depositId;
        try {
            depositId = Long.parseLong(orderId);
        } catch (NumberFormatException e) {
            return Map.of("resultCode", 99, "message", "Order not found");
        }

        DepositTransaction transaction = depositRepository.findById(depositId).orElse(null);
        if (transaction == null) {
            return Map.of("resultCode", 99, "message", "Order not found");
        }

        // 2. Check Idempotency
        if (transaction.getStatus() != DepositStatus.PENDING_PAYMENT) {
            log.info("Transaction {} already processed with status {}", depositId, transaction.getStatus());
            return Map.of("resultCode", 0, "message", "Order already confirmed");
        }

        // 3. Check Amount (MoMo amount is numeric string)
        String momoAmountStr = params.get("amount");
        if (momoAmountStr == null || momoAmountStr.isEmpty()) {
            return Map.of("resultCode", 99, "message", "Invalid Amount");
        }

        long momoAmount = Long.parseLong(momoAmountStr);
        if (momoAmount != transaction.getAmount()) {
            log.error("Amount mismatch for MoMo transaction {}: Expected {}, Got {}", depositId, transaction.getAmount(), momoAmount);
            logEvent(transaction, "PAYMENT_FAILED", null, "Số tiền không khớp (MoMo). Mong đợi: " + transaction.getAmount() + ", Nhận được: " + momoAmount);
            return Map.of("resultCode", 99, "message", "Invalid Amount");
        }

        // 4. Update Status based on resultCode
        String resultCodeStr = params.get("resultCode");
        String transId = params.get("transId");

        if ("0".equals(resultCodeStr)) {
            transaction.setStatus(DepositStatus.PAID);
            transaction.setPaidAt(LocalDateTime.now());
            transaction.setPaymentGatewayRef(transId);
            
            // Set payment detail JSON
            Map<String, Object> detail = new HashMap<>();
            detail.put("transId", transId);
            detail.put("payType", params.get("payType"));
            detail.put("responseTime", params.get("responseTime"));
            transaction.setPaymentMethodDetail(detail);

            if (transaction.getMoveInDate() != null) {
                transaction.setReleaseDeadline(transaction.getMoveInDate().atStartOfDay().plusDays(7));
            } else {
                transaction.setReleaseDeadline(LocalDateTime.now().plusDays(10));
            }

            log.info("Transaction {} marked as PAID via MoMo", depositId);
            logEvent(transaction, "PAYMENT_SUCCESS", null, "Thanh toán thành công qua MoMo. Ref: " + transId);

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
                log.error("Failed to send payment success notifications for MoMo", e);
            }
        } else {
            transaction.setStatus(DepositStatus.CANCELLED);
            log.warn("Transaction {} payment failed with MoMo code {}", depositId, resultCodeStr);
            logEvent(transaction, "PAYMENT_FAILED", null, "Thanh toán thất bại qua MoMo với mã: " + resultCodeStr);
        }

        depositRepository.save(transaction);

        // Save to Redis to prevent double processing
        redisTemplate.opsForValue().set(redisKey, "1", 7, java.util.concurrent.TimeUnit.DAYS);

        return Map.of("resultCode", 0, "message", "Confirm Success");
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
    public String initiatePayment(Long depositId, String method, String ipAddress, String email) {
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

        PaymentGateway gateway = getGateway(method);

        String orderInfo = "Thanh toan dat coc " + transaction.getId();
        String paymentUrl = gateway.createPaymentUrl(transaction.getAmount(), transaction.getId().toString(), orderInfo, ipAddress);
        
        transaction.setPaymentUrl(paymentUrl);
        transaction.setPaymentMethod(gateway.getGatewayName());
        depositRepository.save(transaction);

        return paymentUrl;
    }

    private PaymentGateway getGateway(String method) {
        return paymentGateways.stream()
                .filter(g -> g.getGatewayName().equalsIgnoreCase(method))
                .findFirst()
                .orElseThrow(() -> new BusinessException("Cổng thanh toán không hỗ trợ: " + method));
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

    @Transactional
    public DepositResponse confirmMoveIn(Long id, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        DepositTransaction transaction = depositRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch đặt cọc không tồn tại"));

        if (!transaction.getTenant().getId().equals(currentUser.getId())) {
            throw new BusinessException("Chỉ người thuê mới có quyền xác nhận nhận phòng");
        }

        if (transaction.getStatus() != DepositStatus.PAID) {
            throw new BusinessException("Giao dịch không ở trạng thái ĐÃ THANH TOÁN");
        }

        transaction.setStatus(DepositStatus.RELEASED);
        transaction.setReleasedAt(LocalDateTime.now());
        depositRepository.save(transaction);

        // Trigger Payout
        payoutService.createPayoutRequest(transaction);

        // Log event
        logEvent(transaction, "MOVE_IN_CONFIRMED", currentUser, "Người thuê xác nhận đã nhận phòng. Tiền đặt cọc được giải ngân.");

        // Generate and save contract PDF
        try {
            rentalContractService.generateAndSaveContract(transaction);
        } catch (Exception e) {
            log.error("Failed to generate rental contract for transaction {}", transaction.getId(), e);
        }

        // Send notifications
        try {
            notificationService.createAndSendNotification(
                    transaction.getLandlord(),
                    "Giải ngân tiền đặt cọc",
                    "Người thuê đã xác nhận nhận phòng thành công cho tin đăng \"" + transaction.getListing().getTitle() + "\". Tiền cọc đã được giải ngân.",
                    com.rentspace.domain.notification.enums.NotificationType.DEPOSIT
            );
        } catch (Exception e) {
            log.error("Failed to send release notification", e);
        }

        return depositMapper.toResponse(transaction);
    }

    @Transactional
    public DepositResponse openDispute(Long id, DisputeReason reason, String description, List<String> evidenceUrls, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        DepositTransaction transaction = depositRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch đặt cọc không tồn tại"));

        if (!transaction.getTenant().getId().equals(currentUser.getId()) &&
            !transaction.getLandlord().getId().equals(currentUser.getId())) {
            throw new BusinessException("Bạn không có quyền khiếu nại giao dịch này");
        }

        if (transaction.getStatus() != DepositStatus.PAID) {
            throw new BusinessException("Chỉ có thể khiếu nại các giao dịch ở trạng thái ĐÃ THANH TOÁN");
        }

        if (disputeRepository.findByTransactionId(id).isPresent()) {
            throw new BusinessException("Giao dịch đặt cọc này đã có khiếu nại đang mở");
        }

        DepositDispute dispute = DepositDispute.builder()
                .transaction(transaction)
                .openedBy(currentUser)
                .reason(reason)
                .description(description)
                .evidenceUrls(evidenceUrls)
                .status(DisputeStatus.OPEN)
                .build();

        disputeRepository.save(dispute);

        transaction.setStatus(DepositStatus.DISPUTED);
        depositRepository.save(transaction);

        // Log event
        logEvent(transaction, "DISPUTE_OPENED", currentUser, "Yêu cầu khiếu nại đã được mở bởi " + currentUser.getFullName() + ". Lý do: " + reason);

        // Send notifications to the other party
        User otherParty = transaction.getTenant().getId().equals(currentUser.getId()) ? transaction.getLandlord() : transaction.getTenant();
        try {
            notificationService.createAndSendNotification(
                    otherParty,
                    "Giao dịch đặt cọc bị tranh chấp",
                    currentUser.getFullName() + " đã yêu cầu khiếu nại giao dịch đặt cọc cho tin đăng \"" + transaction.getListing().getTitle() + "\".",
                    com.rentspace.domain.notification.enums.NotificationType.DEPOSIT
            );
        } catch (Exception e) {
            log.error("Failed to send dispute notifications", e);
        }

        return depositMapper.toResponse(transaction);
    }

    @Transactional
    public DepositResponse resolveDispute(Long disputeId, DisputeStatus resolution, String resolutionNote, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại"));

        DepositDispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException("Tranh chấp không tồn tại"));

        if (dispute.getStatus() != DisputeStatus.OPEN && dispute.getStatus() != DisputeStatus.UNDER_REVIEW) {
            throw new BusinessException("Tranh chấp này đã được đóng hoặc giải quyết trước đó");
        }

        DepositTransaction transaction = dispute.getTransaction();

        dispute.setStatus(resolution);
        dispute.setResolutionNote(resolutionNote);
        dispute.setResolvedBy(admin);
        dispute.setResolvedAt(LocalDateTime.now());
        disputeRepository.save(dispute);

        if (resolution == DisputeStatus.RESOLVED_TENANT) {
            transaction.setStatus(DepositStatus.REFUNDED);
            transaction.setRefundedAt(LocalDateTime.now());
            logEvent(transaction, "DISPUTE_RESOLVED_REFUND", admin, "Admin giải quyết tranh chấp: Hoàn trả tiền cọc cho người thuê. Lý do: " + resolutionNote);
        } else if (resolution == DisputeStatus.RESOLVED_LANDLORD) {
            transaction.setStatus(DepositStatus.RELEASED);
            transaction.setReleasedAt(LocalDateTime.now());
            
            // Trigger Payout
            payoutService.createPayoutRequest(transaction);

            logEvent(transaction, "DISPUTE_RESOLVED_RELEASE", admin, "Admin giải quyết tranh chấp: Giải ngân tiền cọc cho chủ nhà. Lý do: " + resolutionNote);
            
            // Generate and save contract PDF
            try {
                rentalContractService.generateAndSaveContract(transaction);
            } catch (Exception e) {
                log.error("Failed to generate contract after dispute resolution for transaction {}", transaction.getId(), e);
            }
        } else {
            transaction.setStatus(DepositStatus.CANCELLED);
            logEvent(transaction, "DISPUTE_CLOSED", admin, "Admin đóng tranh chấp. Lý do: " + resolutionNote);
        }

        depositRepository.save(transaction);

        // Send notifications to both parties
        try {
            notificationService.createAndSendNotification(
                    transaction.getTenant(),
                    "Kết quả giải quyết tranh chấp",
                    "Tranh chấp đặt cọc của bạn đã được giải quyết bởi Admin. Kết quả: " + resolution,
                    com.rentspace.domain.notification.enums.NotificationType.DEPOSIT
            );
            notificationService.createAndSendNotification(
                    transaction.getLandlord(),
                    "Kết quả giải quyết tranh chấp",
                    "Tranh chấp đặt cọc của bạn đã được giải quyết bởi Admin. Kết quả: " + resolution,
                    com.rentspace.domain.notification.enums.NotificationType.DEPOSIT
            );
        } catch (Exception e) {
            log.error("Failed to send dispute resolution notifications", e);
        }

        return depositMapper.toResponse(transaction);
    }

    @Transactional
    @Scheduled(cron = "0 0 * * * *")
    public void autoReleaseDeposits() {
        log.info("Starting auto-release cron job for deposits...");
        LocalDateTime now = LocalDateTime.now();
        
        List<DepositTransaction> expiredDeposits = depositRepository.findAllByStatusAndReleaseDeadlineBefore(DepositStatus.PAID, now);
        
        int processedCount = 0;
        for (DepositTransaction transaction : expiredDeposits) {
            Optional<DepositDispute> disputeOpt = disputeRepository.findByTransactionId(transaction.getId());
            if (disputeOpt.isPresent()) {
                log.info("Skipping auto-release for deposit {} due to existing dispute", transaction.getId());
                continue;
            }
            
            transaction.setStatus(DepositStatus.RELEASED);
            transaction.setReleasedAt(now);
            depositRepository.save(transaction);

            // Trigger Payout
            payoutService.createPayoutRequest(transaction);
            
            logEvent(transaction, "AUTO_RELEASED", null, "Hệ thống tự động giải ngân tiền đặt cọc sau thời hạn release deadline.");
            
            // Generate and save contract PDF
            try {
                rentalContractService.generateAndSaveContract(transaction);
            } catch (Exception e) {
                log.error("Failed to generate contract on auto release for transaction {}", transaction.getId(), e);
            }
            
            try {
                notificationService.createAndSendNotification(
                        transaction.getLandlord(),
                        "Tự động giải ngân đặt cọc",
                        "Hệ thống tự động giải ngân cọc cho tin đăng \"" + transaction.getListing().getTitle() + "\" do quá thời hạn chờ.",
                        com.rentspace.domain.notification.enums.NotificationType.DEPOSIT
                );
            } catch (Exception e) {
                log.error("Failed to send auto-release notification for transaction {}", transaction.getId(), e);
            }
            processedCount++;
        }
        
        log.info("Completed auto-release cron job. Processed {} deposits.", processedCount);
    }

    public List<DisputeResponse> getAllDisputes() {
        return disputeRepository.findAll().stream()
                .map(depositMapper::toDisputeResponse)
                .collect(Collectors.toList());
    }

    public DisputeResponse getDisputeByTransactionId(Long transactionId, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại"));

        DepositDispute dispute = disputeRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khiếu nại cho giao dịch này"));

        DepositTransaction transaction = dispute.getTransaction();
        if (!transaction.getTenant().getId().equals(currentUser.getId()) &&
            !transaction.getLandlord().getId().equals(currentUser.getId()) &&
            currentUser.getRole() != Role.ADMIN) {
            throw new BusinessException("Bạn không có quyền truy cập khiếu nại này");
        }

        return depositMapper.toDisputeResponse(dispute);
    }

    public LandlordDepositSummary getLandlordSummary(String landlordEmail) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chủ nhà với email: " + landlordEmail));

        Long landlordId = landlord.getId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneWeekAgo = now.minusDays(7);
        LocalDateTime oneMonthAgo = now.minusDays(30);

        long completedCount = depositRepository.countCompletedDepositsByLandlordId(landlordId);
        long totalNetAmount = depositRepository.sumTotalNetAmountByLandlordId(landlordId);
        long weeklyNetAmount = depositRepository.sumNetAmountByLandlordIdAndReleasedAtAfter(landlordId, oneWeekAgo);
        long monthlyNetAmount = depositRepository.sumNetAmountByLandlordIdAndReleasedAtAfter(landlordId, oneMonthAgo);

        return LandlordDepositSummary.builder()
                .completedCount(completedCount)
                .totalNetAmount(totalNetAmount)
                .weeklyNetAmount(weeklyNetAmount)
                .monthlyNetAmount(monthlyNetAmount)
                .build();
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


