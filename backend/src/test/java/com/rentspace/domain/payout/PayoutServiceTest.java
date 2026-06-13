package com.rentspace.domain.payout;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.payout.dto.PayoutAccountRequest;
import com.rentspace.domain.payout.dto.PayoutAccountResponse;
import com.rentspace.domain.payout.dto.PayoutResponse;
import com.rentspace.domain.payout.enums.PayoutStatus;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.infrastructure.security.AesEncryptionUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayoutServiceTest {

    @Mock
    private PayoutRepository payoutRepository;

    @Mock
    private LandlordPayoutAccountRepository payoutAccountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepositTransactionRepository depositRepository;

    @Mock
    private PayoutMapper payoutMapper;

    @Mock
    private AesEncryptionUtil aesEncryptionUtil;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PayoutService payoutService;

    private User landlord;
    private LandlordPayoutAccount payoutAccount;
    private DepositTransaction deposit;

    @BeforeEach
    void setUp() {
        landlord = User.builder()
                .id(1L)
                .email("landlord@example.com")
                .fullName("Landlord A")
                .build();

        payoutAccount = LandlordPayoutAccount.builder()
                .id(10L)
                .user(landlord)
                .bankName("Vietcombank")
                .bankCode("VCB")
                .accountNumber("ENCRYPTED_123456")
                .accountName("LANDLORD A")
                .isVerified(true)
                .build();

        Listing listing = Listing.builder()
                .id(100L)
                .title("Beautiful Room")
                .build();

        deposit = DepositTransaction.builder()
                .id(50L)
                .landlord(landlord)
                .listing(listing)
                .amount(3000000L)
                .platformFee(60000L)
                .netAmount(2940000L)
                .status(DepositStatus.RELEASED)
                .build();
    }

    @Test
    void linkPayoutAccount_ShouldEncryptAndSave() {
        PayoutAccountRequest request = new PayoutAccountRequest("Vietcombank", "VCB", "1234567890", "LANDLORD A");
        
        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(aesEncryptionUtil.encrypt("1234567890")).thenReturn("ENCRYPTED_123456");
        when(payoutAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(payoutAccountRepository.save(any(LandlordPayoutAccount.class))).thenReturn(payoutAccount);
        when(depositRepository.findByLandlordIdAndStatus(1L, DepositStatus.RELEASED)).thenReturn(List.of(deposit));
        when(payoutRepository.existsByDepositId(50L)).thenReturn(false);

        PayoutAccountResponse mockResponse = new PayoutAccountResponse();
        when(payoutMapper.toResponse(any(LandlordPayoutAccount.class))).thenReturn(mockResponse);

        PayoutAccountResponse response = payoutService.linkPayoutAccount("landlord@example.com", request);

        assertNotNull(response);
        verify(payoutAccountRepository, times(1)).save(any(LandlordPayoutAccount.class));
        verify(payoutRepository, times(1)).save(any(Payout.class)); // Verifies backfill triggers
    }

    @Test
    void createPayoutRequest_WithLinkedAccount_ShouldSavePayout() {
        when(payoutRepository.existsByDepositId(50L)).thenReturn(false);
        when(payoutAccountRepository.findByUserId(1L)).thenReturn(Optional.of(payoutAccount));

        payoutService.createPayoutRequest(deposit);

        verify(payoutRepository, times(1)).save(any(Payout.class));
        verify(notificationService, times(1)).createAndSendNotification(
                eq(landlord), anyString(), anyString(), eq(NotificationType.PAYMENT)
        );
    }

    @Test
    void createPayoutRequest_NoLinkedAccount_ShouldSkip() {
        when(payoutRepository.existsByDepositId(50L)).thenReturn(false);
        when(payoutAccountRepository.findByUserId(1L)).thenReturn(Optional.empty());

        payoutService.createPayoutRequest(deposit);

        verify(payoutRepository, never()).save(any(Payout.class));
    }

    @Test
    void processPayout_ShouldUpdateStatusAndNotify() {
        Payout payout = Payout.builder()
                .id(20L)
                .landlord(landlord)
                .amount(2940000L)
                .fee(0L)
                .netAmount(2940000L)
                .status(PayoutStatus.PENDING)
                .build();

        User admin = User.builder().id(9L).email("admin@example.com").build();

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(payoutRepository.findById(20L)).thenReturn(Optional.of(payout));
        when(payoutRepository.save(payout)).thenReturn(payout);

        PayoutResponse mockResponse = new PayoutResponse();
        when(payoutMapper.toResponse(payout)).thenReturn(mockResponse);

        PayoutResponse response = payoutService.processPayout(
                20L, "admin@example.com", PayoutStatus.COMPLETED, "REF12345", "Chuyển khoản thành công"
        );

        assertNotNull(response);
        assertEquals(PayoutStatus.COMPLETED, payout.getStatus());
        assertEquals("REF12345", payout.getBankRef());
        verify(notificationService, times(1)).createAndSendNotification(
                eq(landlord), eq("Giải ngân thành công"), anyString(), eq(NotificationType.PAYMENT)
        );
    }
}
