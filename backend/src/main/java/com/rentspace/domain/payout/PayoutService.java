package com.rentspace.domain.payout;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.payout.dto.PayoutAccountRequest;
import com.rentspace.domain.payout.dto.PayoutAccountResponse;
import com.rentspace.domain.payout.dto.PayoutResponse;
import com.rentspace.domain.payout.enums.PayoutStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.infrastructure.security.AesEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PayoutService {

    private final PayoutRepository payoutRepository;
    private final LandlordPayoutAccountRepository payoutAccountRepository;
    private final UserRepository userRepository;
    private final DepositTransactionRepository depositRepository;
    private final PayoutMapper payoutMapper;
    private final AesEncryptionUtil aesEncryptionUtil;
    private final NotificationService notificationService;

    @Transactional
    public PayoutAccountResponse linkPayoutAccount(String landlordEmail, PayoutAccountRequest request) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + landlordEmail));

        // Encrypt sensitive account number
        String encryptedAccountNumber = aesEncryptionUtil.encrypt(request.getAccountNumber());

        LandlordPayoutAccount account = payoutAccountRepository.findByUserId(landlord.getId())
                .orElse(null);

        if (account == null) {
            account = LandlordPayoutAccount.builder()
                    .user(landlord)
                    .bankName(request.getBankName())
                    .bankCode(request.getBankCode())
                    .accountNumber(encryptedAccountNumber)
                    .accountName(request.getAccountName().toUpperCase().trim())
                    .isVerified(true) // Set default verified for demo/sandbox purposes
                    .verifiedAt(LocalDateTime.now())
                    .build();
        } else {
            account.setBankName(request.getBankName());
            account.setBankCode(request.getBankCode());
            account.setAccountNumber(encryptedAccountNumber);
            account.setAccountName(request.getAccountName().toUpperCase().trim());
            account.setUpdatedAt(LocalDateTime.now());
        }

        account = payoutAccountRepository.save(account);

        // Scan and backfill any PENDING/RELEASED deposits that do not have a payout request yet
        backfillPendingPayouts(landlord.getId(), account);

        return payoutMapper.toResponse(account);
    }

    public PayoutAccountResponse getPayoutAccount(String landlordEmail) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + landlordEmail));

        LandlordPayoutAccount account = payoutAccountRepository.findByUserId(landlord.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Chủ nhà chưa liên kết tài khoản ngân hàng"));

        return payoutMapper.toResponse(account);
    }

    @Transactional
    public void createPayoutRequest(DepositTransaction deposit) {
        if (payoutRepository.existsByDepositId(deposit.getId())) {
            log.info("Payout already exists for deposit transaction: {}", deposit.getId());
            return;
        }

        Long landlordId = deposit.getLandlord().getId();
        Optional<LandlordPayoutAccount> accountOpt = payoutAccountRepository.findByUserId(landlordId);

        if (accountOpt.isEmpty()) {
            log.warn("Landlord {} has not linked a bank account yet. Skipping automatic payout request for deposit {}.", landlordId, deposit.getId());
            return;
        }

        LandlordPayoutAccount payoutAccount = accountOpt.get();
        createPayoutRecord(deposit, payoutAccount);
    }

    private void createPayoutRecord(DepositTransaction deposit, LandlordPayoutAccount payoutAccount) {
        long amount = deposit.getNetAmount(); // Landlord receives the Net Amount (amount - platform_fee)
        long fee = 0L; // Transfer fee can be 0 by default
        long netAmount = amount - fee;

        Payout payout = Payout.builder()
                .landlord(deposit.getLandlord())
                .payoutAccount(payoutAccount)
                .deposit(deposit)
                .amount(amount)
                .fee(fee)
                .netAmount(netAmount)
                .status(PayoutStatus.PENDING)
                .build();

        payoutRepository.save(payout);
        log.info("Created PENDING payout request for deposit {} to landlord bank account {}", deposit.getId(), payoutAccount.getId());

        // Send Notification
        try {
            notificationService.createAndSendNotification(
                    deposit.getLandlord(),
                    "Yêu cầu giải ngân được tạo",
                    "Hệ thống đã tạo yêu cầu giải ngân số tiền " + amount + " VND cho tin đăng \"" + deposit.getListing().getTitle() + "\".",
                    NotificationType.PAYMENT
            );
        } catch (Exception e) {
            log.error("Failed to send payout creation notification", e);
        }
    }

    private void backfillPendingPayouts(Long landlordId, LandlordPayoutAccount payoutAccount) {
        List<DepositTransaction> releasedDeposits = depositRepository.findByLandlordIdAndStatus(landlordId, DepositStatus.RELEASED);
        for (DepositTransaction deposit : releasedDeposits) {
            if (!payoutRepository.existsByDepositId(deposit.getId())) {
                createPayoutRecord(deposit, payoutAccount);
            }
        }
    }

    public Page<PayoutResponse> getPayoutHistory(String landlordEmail, Pageable pageable) {
        User landlord = userRepository.findByEmail(landlordEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + landlordEmail));

        return payoutRepository.findAllByLandlordId(landlord.getId(), pageable)
                .map(payoutMapper::toResponse);
    }

    public Page<PayoutResponse> getPendingPayoutsForAdmin(PayoutStatus status, Pageable pageable) {
        return payoutRepository.findAllByStatus(status, pageable)
                .map(payoutMapper::toResponse);
    }

    @Transactional
    public PayoutResponse processPayout(Long payoutId, String adminEmail, PayoutStatus status, String bankRef, String note) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin không tồn tại: " + adminEmail));

        Payout payout = payoutRepository.findById(payoutId)
                .orElseThrow(() -> new ResourceNotFoundException("Yêu cầu giải ngân không tồn tại: " + payoutId));

        if (payout.getStatus() == PayoutStatus.COMPLETED) {
            throw new BusinessException("Yêu cầu giải ngân này đã hoàn tất và không thể chỉnh sửa");
        }

        payout.setStatus(status);
        payout.setBankRef(bankRef);
        payout.setNote(note);
        payout.setProcessedAt(LocalDateTime.now());
        payout = payoutRepository.save(payout);

        // Notify landlord
        try {
            String title = status == PayoutStatus.COMPLETED ? "Giải ngân thành công" : "Giải ngân thất bại";
            String content = status == PayoutStatus.COMPLETED
                    ? "Yêu cầu giải ngân số tiền " + payout.getNetAmount() + " VND của bạn đã thành công. Mã giao dịch: " + bankRef
                    : "Yêu cầu giải ngân số tiền " + payout.getNetAmount() + " VND của bạn thất bại. Lý do: " + note;

            notificationService.createAndSendNotification(
                    payout.getLandlord(),
                    title,
                    content,
                    NotificationType.PAYMENT
            );
        } catch (Exception e) {
            log.error("Failed to send payout processing notification", e);
        }

        return payoutMapper.toResponse(payout);
    }
}
