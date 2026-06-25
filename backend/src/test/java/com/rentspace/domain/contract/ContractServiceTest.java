package com.rentspace.domain.contract;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.contract.dto.ContractResponse;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.email.EmailService;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.verification.UserVerification;
import com.rentspace.domain.verification.UserVerificationRepository;
import com.rentspace.domain.verification.VerificationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock private ContractRepository contractRepository;
    @Mock private DepositTransactionRepository depositRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserVerificationRepository verificationRepository;
    @Mock private ContractTemplateService templateService;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;

    @InjectMocks
    private ContractServiceImpl service;

    private com.rentspace.domain.user.User landlord;
    private com.rentspace.domain.user.User tenant;
    private Listing listing;
    private DepositTransaction deposit;
    private Contract pendingContract;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "signDeadlineDays", 7);

        landlord = com.rentspace.domain.user.User.builder()
                .id(1L).email("landlord@test.com").fullName("Chủ nhà A")
                .phoneNumber("0901000001").build();

        tenant = com.rentspace.domain.user.User.builder()
                .id(2L).email("tenant@test.com").fullName("Người thuê B")
                .phoneNumber("0902000002").build();

        listing = Listing.builder()
                .id(10L).title("Phòng cao cấp Q1").address("12 Lê Lợi, Q1, HCM")
                .pricePerMonth(new BigDecimal("5000000"))
                .landlord(landlord).build();

        deposit = DepositTransaction.builder()
                .id(100L).listing(listing).landlord(landlord).tenant(tenant)
                .amount(5_000_000L).platformFee(250_000L).netAmount(4_750_000L)
                .moveInDate(java.time.LocalDate.now().plusDays(30))
                .build();

        pendingContract = Contract.builder()
                .id(50L).deposit(deposit).landlord(landlord).tenant(tenant)
                .contentSnapshot("<html>hợp đồng</html>")
                .status(ContractStatus.PENDING_SIGNATURES)
                .expiresAt(Instant.now().plusSeconds(86400 * 7))
                .build();
    }

    // ── generateContract ────────────────────────────────────────────────────

    @Nested
    class GenerateContract {

        @Test
        void whenContractAlreadyExists_throwsBusinessException() {
            when(contractRepository.findByDepositId(100L))
                    .thenReturn(Optional.of(pendingContract));

            assertThatThrownBy(() -> service.generateContract(100L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã tồn tại");

            verify(contractRepository, never()).save(any());
        }

        @Test
        void whenDepositNotFound_throwsResourceNotFoundException() {
            when(contractRepository.findByDepositId(999L)).thenReturn(Optional.empty());
            when(depositRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.generateContract(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        void happyPath_savesDraftContractAndNotifiesBothParties() {
            when(contractRepository.findByDepositId(100L)).thenReturn(Optional.empty());
            when(depositRepository.findById(100L)).thenReturn(Optional.of(deposit));
            when(templateService.formatCurrency(any(BigDecimal.class))).thenReturn("5.000.000 đồng");
            when(templateService.formatCurrency(any(Long.class))).thenReturn("5.000.000 đồng");
            when(templateService.formatDate(any(Instant.class))).thenReturn("01/01/2026");
            when(templateService.formatDate(any(java.time.LocalDate.class))).thenReturn("01/01/2026");
            when(templateService.buildContentSnapshot(any())).thenReturn("<html>contract</html>");

            Contract saved = Contract.builder()
                    .id(51L).deposit(deposit).landlord(landlord).tenant(tenant)
                    .contentSnapshot("<html>contract</html>")
                    .status(ContractStatus.DRAFT)
                    .expiresAt(Instant.now().plusSeconds(86400 * 8))
                    .createdAt(Instant.now())
                    .build();
            when(contractRepository.save(any(Contract.class))).thenReturn(saved);

            ContractResponse result = service.generateContract(100L);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo("DRAFT");
            assertThat(result.getPdfUrl()).contains("/api/v1/contracts/51/pdf");

            // Cả hai bên đều nhận notification
            verify(notificationService, times(2))
                    .createAndSendNotification(any(), anyString(), anyString(), any());
        }
    }

    // ── signContract ────────────────────────────────────────────────────────

    @Nested
    class SignContract {

        @Test
        void whenUserNotVerified_throwsBusinessException() {
            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));
            when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(tenant));
            when(verificationRepository.findByUserId(2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.signContract(50L, "tenant@test.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("xác minh danh tính");
        }

        @Test
        void whenContractIsDraft_throwsBusinessException() {
            Contract draftContract = Contract.builder()
                    .id(51L).deposit(deposit).landlord(landlord).tenant(tenant)
                    .contentSnapshot("<html/>").status(ContractStatus.DRAFT)
                    .expiresAt(Instant.now().plusSeconds(86400)).build();
            UserVerification verified = UserVerification.builder()
                    .user(tenant).status(VerificationStatus.VERIFIED).build();

            when(contractRepository.findById(51L)).thenReturn(Optional.of(draftContract));
            when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(tenant));
            when(verificationRepository.findByUserId(2L)).thenReturn(Optional.of(verified));

            assertThatThrownBy(() -> service.signContract(51L, "tenant@test.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("xem xét");
        }

        @Test
        void whenUserNotParticipant_throwsBusinessException() {
            com.rentspace.domain.user.User outsider = com.rentspace.domain.user.User.builder()
                    .id(99L).email("outsider@test.com").fullName("Người ngoài").build();
            UserVerification verified = UserVerification.builder()
                    .user(outsider).status(VerificationStatus.VERIFIED).build();

            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));
            when(userRepository.findByEmail("outsider@test.com")).thenReturn(Optional.of(outsider));
            when(verificationRepository.findByUserId(99L)).thenReturn(Optional.of(verified));

            assertThatThrownBy(() -> service.signContract(50L, "outsider@test.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("không phải là bên");
        }

        @Test
        void whenLandlordSigns_setsLandlordSignedAtAndNotifiesTenant() {
            UserVerification verified = UserVerification.builder()
                    .user(landlord).status(VerificationStatus.VERIFIED).build();

            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));
            when(userRepository.findByEmail("landlord@test.com")).thenReturn(Optional.of(landlord));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(verified));
            when(contractRepository.save(any())).thenReturn(pendingContract);

            service.signContract(50L, "landlord@test.com");

            assertThat(pendingContract.getLandlordSignedAt()).isNotNull();
            assertThat(pendingContract.getStatus()).isEqualTo(ContractStatus.PENDING_SIGNATURES);
            // Thông báo cho tenant biết landlord đã ký
            verify(notificationService).createAndSendNotification(
                    eq(tenant), anyString(), anyString(), any());
        }

        @Test
        void whenBothSigned_setsFullySignedAndSendsEmail() {
            // Landlord đã ký trước
            pendingContract.setLandlordSignedAt(Instant.now().minusSeconds(3600));

            UserVerification verified = UserVerification.builder()
                    .user(tenant).status(VerificationStatus.VERIFIED).build();

            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));
            when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(tenant));
            when(verificationRepository.findByUserId(2L)).thenReturn(Optional.of(verified));
            when(templateService.renderPdf(anyString())).thenReturn(new byte[]{0x25, 0x50, 0x44, 0x46}); // %PDF
            when(contractRepository.save(any())).thenReturn(pendingContract);

            service.signContract(50L, "tenant@test.com");

            assertThat(pendingContract.getStatus()).isEqualTo(ContractStatus.FULLY_SIGNED);
            // Cả hai nhận notification FULLY_SIGNED (thêm 2 notification nữa)
            verify(notificationService, atLeast(2))
                    .createAndSendNotification(any(), anyString(), anyString(), any());
            // Email kèm PDF gửi cho cả hai
            verify(emailService).sendContractSignedEmail(
                    eq("landlord@test.com"), anyString(), any(byte[].class));
            verify(emailService).sendContractSignedEmail(
                    eq("tenant@test.com"), anyString(), any(byte[].class));
        }

        @Test
        void whenAlreadySigned_throwsBusinessException() {
            pendingContract.setLandlordSignedAt(Instant.now().minusSeconds(100));
            UserVerification verified = UserVerification.builder()
                    .user(landlord).status(VerificationStatus.VERIFIED).build();

            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));
            when(userRepository.findByEmail("landlord@test.com")).thenReturn(Optional.of(landlord));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(verified));

            assertThatThrownBy(() -> service.signContract(50L, "landlord@test.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã ký");
        }
    }

    // ── cancelContract ──────────────────────────────────────────────────────

    @Nested
    class CancelContract {

        @Test
        void whenFullySigned_throwsBusinessException() {
            pendingContract.setStatus(ContractStatus.FULLY_SIGNED);
            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));

            assertThatThrownBy(() -> service.cancelContract(50L, "vi phạm điều khoản"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("không thể hủy");
        }

        @Test
        void happyPath_setsStatusAndNotifiesBothParties() {
            when(contractRepository.findById(50L)).thenReturn(Optional.of(pendingContract));
            when(contractRepository.save(any())).thenReturn(pendingContract);

            service.cancelContract(50L, "lý do admin");

            assertThat(pendingContract.getStatus()).isEqualTo(ContractStatus.CANCELLED);
            assertThat(pendingContract.getCancellationReason()).isEqualTo("lý do admin");
            verify(notificationService, times(2))
                    .createAndSendNotification(any(), anyString(), anyString(), any());
        }
    }
}
