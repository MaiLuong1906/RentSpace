package com.rentspace.domain.contract;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.contract.dto.ContractResponse;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final DepositTransactionRepository depositRepository;
    private final UserRepository userRepository;
    private final ContractTemplateService templateService;

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

        String snapshot = templateService.buildContentSnapshot(vars);

        Contract contract = Contract.builder()
                .deposit(deposit)
                .landlord(deposit.getLandlord())
                .tenant(deposit.getTenant())
                .contentSnapshot(snapshot)
                .status(ContractStatus.PENDING_SIGNATURES)
                .expiresAt(Instant.now().plus(signDeadlineDays, ChronoUnit.DAYS))
                .build();

        contract = contractRepository.save(contract);
        log.info("Hợp đồng tạo thành công: id={}, depositId={}", contract.getId(), depositId);
        return toResponse(contract);
    }

    @Override
    @Transactional
    public ContractResponse signContract(Long contractId, String userEmail) {
        Contract contract = findContractById(contractId);
        User user = findUser(userEmail);

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
        } else {
            if (contract.getTenantSignedAt() != null) {
                throw new BusinessException("Bạn đã ký hợp đồng này rồi.");
            }
            contract.setTenantSignedAt(Instant.now());
        }

        if (contract.getLandlordSignedAt() != null && contract.getTenantSignedAt() != null) {
            contract.setStatus(ContractStatus.FULLY_SIGNED);
            log.info("Hợp đồng FULLY_SIGNED: id={}", contractId);
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
        log.info("Admin hủy hợp đồng id={}, reason={}", contractId, reason);
    }

    // ===== Helpers =====

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
                .pdfUrl(c.getPdfUrl())
                .cancellationReason(c.getCancellationReason())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
