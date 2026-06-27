package com.rentspace.domain.contract;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.contract.dto.ContractResponse;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.email.EmailService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.verification.UserVerificationRepository;
import com.rentspace.domain.verification.VerificationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final DepositTransactionRepository depositRepository;
    private final UserRepository userRepository;
    private final UserVerificationRepository verificationRepository;
    private final ContractTemplateService templateService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Value("${app.contract.sign-deadline-days:7}")
    private int signDeadlineDays;

    @Override
    @Transactional
    public ContractResponse generateContract(Long depositId) {
        if (contractRepository.findByDepositId(depositId).isPresent()) {
            throw new BusinessException("Hợp đồng cho giao dịch này đã tồn tại.");
        }

        DepositTransaction deposit = depositRepository.findById(depositId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch id=" + depositId));

        Map<String, Object> vars = Map.of(
            "landlordName",   deposit.getLandlord().getFullName(),
            "landlordPhone",  nvl(deposit.getLandlord().getPhoneNumber()),
            "tenantName",     deposit.getTenant().getFullName(),
            "tenantPhone",    nvl(deposit.getTenant().getPhoneNumber()),
            "listingTitle",   deposit.getListing().getTitle(),
            "listingAddress", deposit.getListing().getAddress(),
            "pricePerMonth",  templateService.formatCurrency(deposit.getListing().getPricePerMonth()),
            "depositAmount",  templateService.formatCurrency(deposit.getAmount()),
            "moveInDate",     templateService.formatDate(deposit.getMoveInDate()),
            "generatedAt",    templateService.formatDate(Instant.now())
        );

        // Dữ liệu có cấu trúc cho AI assistant — raw values, không format
        Map<String, Object> contentJson = new LinkedHashMap<>();
        contentJson.put("landlordName",      deposit.getLandlord().getFullName());
        contentJson.put("landlordPhone",     nvl(deposit.getLandlord().getPhoneNumber()));
        contentJson.put("tenantName",        deposit.getTenant().getFullName());
        contentJson.put("tenantPhone",       nvl(deposit.getTenant().getPhoneNumber()));
        contentJson.put("listingTitle",      deposit.getListing().getTitle());
        contentJson.put("listingAddress",    deposit.getListing().getAddress());
        contentJson.put("pricePerMonthVnd",  deposit.getListing().getPricePerMonth());
        contentJson.put("depositAmountVnd",  deposit.getAmount());
        contentJson.put("moveInDate",        deposit.getMoveInDate() != null ? deposit.getMoveInDate().toString() : null);
        contentJson.put("generatedAt",       Instant.now().toString());

        String snapshot = templateService.buildContentSnapshot(vars);

        // Bắt đầu ở DRAFT — sau 24h scheduler tự chuyển sang PENDING_SIGNATURES
        Contract contract = Contract.builder()
                .deposit(deposit)
                .landlord(deposit.getLandlord())
                .tenant(deposit.getTenant())
                .contentSnapshot(snapshot)
                .contentJson(contentJson)
                .status(ContractStatus.DRAFT)
                .expiresAt(Instant.now().plus(signDeadlineDays + 1L, ChronoUnit.DAYS))
                .build();

        contract = contractRepository.save(contract);
        log.info("Hợp đồng tạo thành công (DRAFT): id={}, depositId={}", contract.getId(), depositId);

        notificationService.createAndSendNotification(
                deposit.getLandlord(),
                "Hợp đồng thuê phòng đã được tạo",
                String.format("Hợp đồng cho phòng \"%s\" đã được tạo. Vui lòng xem xét trong vòng 24h trước khi chuyển sang giai đoạn ký.", deposit.getListing().getTitle()),
                NotificationType.SYSTEM);

        notificationService.createAndSendNotification(
                deposit.getTenant(),
                "Hợp đồng thuê phòng đã được tạo",
                String.format("Hợp đồng cho phòng \"%s\" đã được tạo. Vui lòng xem xét trong vòng 24h trước khi chuyển sang giai đoạn ký.", deposit.getListing().getTitle()),
                NotificationType.SYSTEM);

        return toResponse(contract);
    }

    @Override
    @Transactional
    public ContractResponse signContract(Long contractId, String userEmail) {
        Contract contract = findContractById(contractId);
        User user = findUser(userEmail);

        // Bắt buộc VERIFIED trước khi ký
        boolean isVerified = verificationRepository.findByUserId(user.getId())
                .map(v -> v.getStatus() == VerificationStatus.VERIFIED)
                .orElse(false);
        if (!isVerified) {
            throw new BusinessException(
                    "Bạn cần xác minh danh tính trước khi ký hợp đồng. Vào Cài đặt → Xác minh danh tính để hoàn tất.");
        }

        if (contract.getStatus() == ContractStatus.DRAFT) {
            throw new BusinessException("Hợp đồng đang trong giai đoạn xem xét (24h). Vui lòng chờ đến khi chuyển sang trạng thái chờ ký.");
        }
        if (contract.getStatus() == ContractStatus.FULLY_SIGNED) {
            throw new BusinessException("Hợp đồng đã được ký đầy đủ.");
        }
        if (contract.getStatus() == ContractStatus.CANCELLED
                || contract.getStatus() == ContractStatus.EXPIRED) {
            throw new BusinessException("Hợp đồng đã bị hủy hoặc hết hạn, không thể ký.");
        }

        boolean isLandlord = contract.getLandlord().getId().equals(user.getId());
        boolean isTenant   = contract.getTenant().getId().equals(user.getId());
        if (!isLandlord && !isTenant) {
            throw new BusinessException("Bạn không phải là bên trong hợp đồng này.");
        }

        if (isLandlord) {
            if (contract.getLandlordSignedAt() != null) {
                throw new BusinessException("Bạn đã ký hợp đồng này rồi.");
            }
            contract.setLandlordSignedAt(Instant.now());
            // Thông báo cho tenant biết landlord đã ký
            notificationService.createAndSendNotification(
                    contract.getTenant(),
                    "Chủ nhà đã ký hợp đồng",
                    String.format("Chủ nhà %s đã ký hợp đồng. Đang chờ chữ ký của bạn để hoàn tất.", contract.getLandlord().getFullName()),
                    NotificationType.SYSTEM);
        } else {
            if (contract.getTenantSignedAt() != null) {
                throw new BusinessException("Bạn đã ký hợp đồng này rồi.");
            }
            contract.setTenantSignedAt(Instant.now());
            // Thông báo cho landlord biết tenant đã ký
            notificationService.createAndSendNotification(
                    contract.getLandlord(),
                    "Người thuê đã ký hợp đồng",
                    String.format("Người thuê %s đã ký hợp đồng. Đang chờ chữ ký của bạn để hoàn tất.", contract.getTenant().getFullName()),
                    NotificationType.SYSTEM);
        }

        if (contract.getLandlordSignedAt() != null && contract.getTenantSignedAt() != null) {
            contract.setStatus(ContractStatus.FULLY_SIGNED);
            log.info("Hợp đồng FULLY_SIGNED: id={}", contractId);
            onFullySigned(contract);
        }

        contract = contractRepository.save(contract);
        return toResponse(contract);
    }

    @Override
    public ContractResponse getContract(Long contractId, String userEmail) {
        Contract contract = findContractById(contractId);
        assertParticipant(contract, userEmail);
        return toResponse(contract);
    }

    @Override
    public byte[] downloadPdf(Long contractId, String userEmail) {
        Contract contract = findContractById(contractId);
        assertParticipant(contract, userEmail);
        return templateService.renderPdf(contract.getContentSnapshot());
    }

    @Override
    public Page<ContractResponse> getMyContracts(String userEmail, ContractStatus status, Pageable pageable) {
        User user = findUser(userEmail);
        return contractRepository
                .findByUserIdAndStatus(user.getId(), status, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public void cancelContract(Long contractId, String reason) {
        Contract contract = findContractById(contractId);
        if (contract.getStatus() == ContractStatus.FULLY_SIGNED) {
            throw new BusinessException("Hợp đồng đã ký đầy đủ, không thể hủy.");
        }
        contract.setStatus(ContractStatus.CANCELLED);
        contract.setCancellationReason(reason);
        contractRepository.save(contract);

        notificationService.createAndSendNotification(
                contract.getLandlord(), "Hợp đồng đã bị hủy",
                "Admin đã hủy hợp đồng. Lý do: " + reason, NotificationType.SYSTEM);
        notificationService.createAndSendNotification(
                contract.getTenant(), "Hợp đồng đã bị hủy",
                "Admin đã hủy hợp đồng. Lý do: " + reason, NotificationType.SYSTEM);

        log.info("Admin hủy hợp đồng id={}, reason={}", contractId, reason);
    }

    // ===== Helpers =====

    /** Gửi notification + email PDF khi hợp đồng FULLY_SIGNED */
    private void onFullySigned(Contract contract) {
        String title = "Hợp đồng đã được ký đầy đủ";
        String content = String.format(
                "Hợp đồng thuê phòng \"%s\" đã được cả hai bên ký. File PDF đính kèm qua email.",
                contract.getDeposit().getListing().getTitle());

        notificationService.createAndSendNotification(contract.getLandlord(), title, content, NotificationType.SYSTEM);
        notificationService.createAndSendNotification(contract.getTenant(),   title, content, NotificationType.SYSTEM);

        // Gửi email kèm PDF — async, không ảnh hưởng transaction chính
        try {
            byte[] pdf = templateService.renderPdf(contract.getContentSnapshot());
            emailService.sendContractSignedEmail(contract.getLandlord().getEmail(),
                    contract.getLandlord().getFullName(), pdf);
            emailService.sendContractSignedEmail(contract.getTenant().getEmail(),
                    contract.getTenant().getFullName(), pdf);
        } catch (Exception e) {
            log.error("Không thể gửi email PDF hợp đồng id={}: {}", contract.getId(), e.getMessage());
        }
    }

    private Contract findContractById(Long id) {
        if (id == null) throw new ResourceNotFoundException("Không tìm thấy hợp đồng: id null");
        return contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng id=" + id));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));
    }

    private void assertParticipant(Contract contract, String userEmail) {
        User user = findUser(userEmail);
        boolean isAdmin = user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().name());
        boolean isParticipant = contract.getLandlord().getId().equals(user.getId())
                || contract.getTenant().getId().equals(user.getId());
        if (!isAdmin && !isParticipant) {
            throw new BusinessException("Bạn không có quyền xem hợp đồng này.");
        }
    }

    private String nvl(String s) {
        return s != null ? s : "";
    }

    private ContractResponse toResponse(Contract c) {
        return ContractResponse.builder()
                .id(c.getId())
                .depositId(c.getDeposit().getId())
                .landlordId(c.getLandlord().getId())
                .landlordName(c.getLandlord().getFullName())
                .tenantId(c.getTenant().getId())
                .tenantName(c.getTenant().getFullName())
                .contentSnapshot(c.getContentSnapshot())
                .status(c.getStatus().name())
                .landlordSignedAt(c.getLandlordSignedAt())
                .tenantSignedAt(c.getTenantSignedAt())
                .expiresAt(c.getExpiresAt())
                // pdfUrl luôn trỏ về endpoint download on-demand (MVP, không cần file storage)
                .pdfUrl("/api/v1/contracts/" + c.getId() + "/pdf")
                .cancellationReason(c.getCancellationReason())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
