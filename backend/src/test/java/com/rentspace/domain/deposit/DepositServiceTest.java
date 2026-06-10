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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepositServiceTest {

    @Mock
    private DepositTransactionRepository depositRepository;

    @Mock
    private DepositTransactionEventRepository eventRepository;

    @Mock
    private ListingRepository listingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VnpayService vnpayService;

    @Mock
    private DepositMapper depositMapper;

    @Mock
    private org.springframework.data.redis.core.StringRedisTemplate redisTemplate;

    @Mock
    private com.rentspace.domain.notification.NotificationService notificationService;

    @Mock
    private com.rentspace.infrastructure.email.EmailService emailService;

    @Mock
    private DepositDisputeRepository disputeRepository;

    @Mock
    private com.rentspace.domain.contract.RentalContractService rentalContractService;

    @InjectMocks
    private DepositService depositService;

    private User tenant;
    private User landlord;
    private Listing listing;
    private DepositTransaction transaction;

    @BeforeEach
    void setUp() {
        tenant = User.builder()
                .id(1L)
                .email("tenant@example.com")
                .fullName("Tenant A")
                .build();

        landlord = User.builder()
                .id(2L)
                .email("landlord@example.com")
                .fullName("Landlord B")
                .build();

        listing = Listing.builder()
                .id(100L)
                .title("Nice Apartment")
                .status(ListingStatus.ACTIVE)
                .landlord(landlord)
                .build();

        transaction = DepositTransaction.builder()
                .id(10L)
                .listing(listing)
                .tenant(tenant)
                .landlord(landlord)
                .amount(5000000L)
                .platformFee(100000L)
                .netAmount(4900000L)
                .status(DepositStatus.PENDING_PAYMENT)
                .build();
                
        lenient().when(redisTemplate.hasKey(anyString())).thenReturn(false);
        lenient().when(redisTemplate.opsForValue()).thenReturn(mock(org.springframework.data.redis.core.ValueOperations.class));
    }

    @Test
    void createDeposit_HappyPath_ShouldReturnResponse() {
        // Given
        DepositRequest request = new DepositRequest();
        request.setListingId(100L);
        request.setAmount(5000000L);
        request.setMoveInDate(LocalDate.now().plusDays(10));
        request.setNotes("Test deposit");

        DepositResponse mockResponse = DepositResponse.builder()
                .id(10L)
                .listingId(100L)
                .listingTitle("Nice Apartment")
                .tenantId(1L)
                .landlordId(2L)
                .amount(5000000L)
                .status(DepositStatus.PENDING_PAYMENT)
                .build();

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(depositRepository.existsByListingIdAndTenantIdAndStatusIn(eq(100L), eq(1L), anyList())).thenReturn(false);
        when(depositRepository.save(any(DepositTransaction.class))).thenReturn(transaction);
        when(depositMapper.toResponse(any(DepositTransaction.class))).thenReturn(mockResponse);

        // When
        DepositResponse response = depositService.createDeposit(request, "tenant@example.com");

        // Then
        assertNotNull(response);
        assertEquals(DepositStatus.PENDING_PAYMENT, response.getStatus());
        assertEquals(5000000L, response.getAmount());
        verify(depositRepository, times(1)).save(any(DepositTransaction.class));
        verify(eventRepository, times(1)).save(any(DepositTransactionEvent.class));
    }

    @Test
    void createDeposit_WhenListingNotActive_ShouldThrowBusinessException() {
        // Given
        listing.setStatus(ListingStatus.PENDING); // Not ACTIVE
        DepositRequest request = new DepositRequest();
        request.setListingId(100L);
        request.setAmount(5000000L);

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

        // When & Then
        assertThrows(BusinessException.class, () -> depositService.createDeposit(request, "tenant@example.com"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void createDeposit_WhenActiveDepositExists_ShouldThrowBusinessException() {
        // Given
        DepositRequest request = new DepositRequest();
        request.setListingId(100L);
        request.setAmount(5000000L);

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));
        when(depositRepository.existsByListingIdAndTenantIdAndStatusIn(eq(100L), eq(1L), anyList())).thenReturn(true);

        // When & Then
        assertThrows(BusinessException.class, () -> depositService.createDeposit(request, "tenant@example.com"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void createDeposit_WhenTenantIsLandlord_ShouldThrowBusinessException() {
        // Given
        DepositRequest request = new DepositRequest();
        request.setListingId(100L);
        request.setAmount(5000000L);

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(listingRepository.findById(100L)).thenReturn(Optional.of(listing));

        // When & Then
        assertThrows(BusinessException.class, () -> depositService.createDeposit(request, "landlord@example.com"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void initiatePayment_HappyPath_ShouldReturnPaymentUrl() {
        // Given
        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));
        when(vnpayService.createPaymentUrl(eq(5000000L), eq("10"), eq("127.0.0.1")))
                .thenReturn("http://vnpay.vn/payment");

        // When
        String paymentUrl = depositService.initiatePayment(10L, "127.0.0.1", "tenant@example.com");

        // Then
        assertEquals("http://vnpay.vn/payment", paymentUrl);
        assertEquals("VNPAY", transaction.getPaymentMethod());
        assertEquals("http://vnpay.vn/payment", transaction.getPaymentUrl());
        verify(depositRepository, times(1)).save(transaction);
    }

    @Test
    void initiatePayment_WhenNotTenant_ShouldThrowBusinessException() {
        // Given
        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));

        // When & Then
        assertThrows(BusinessException.class, () -> depositService.initiatePayment(10L, "127.0.0.1", "landlord@example.com"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void processVnpayWebhook_SignatureInvalid_ShouldReturnInvalidChecksum() {
        // Given
        Map<String, String> params = Map.of("vnp_TxnRef", "10");
        when(vnpayService.verifySignature(params)).thenReturn(false);

        // When
        Map<String, String> response = depositService.processVnpayWebhook(params);

        // Then
        assertEquals("97", response.get("RspCode"));
        assertEquals("Invalid Checksum", response.get("Message"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void processVnpayWebhook_OrderNotFound_ShouldReturnOrderNotFound() {
        // Given
        Map<String, String> params = Map.of("vnp_TxnRef", "999");
        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(depositRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Map<String, String> response = depositService.processVnpayWebhook(params);

        // Then
        assertEquals("01", response.get("RspCode"));
        assertEquals("Order not found", response.get("Message"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void processVnpayWebhook_AlreadyProcessed_ShouldReturnAlreadyConfirmed() {
        // Given
        transaction.setStatus(DepositStatus.PAID); // Already PAID
        Map<String, String> params = Map.of("vnp_TxnRef", "10");
        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));

        // When
        Map<String, String> response = depositService.processVnpayWebhook(params);

        // Then
        assertEquals("02", response.get("RspCode"));
        assertEquals("Order already confirmed", response.get("Message"));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void processVnpayWebhook_AmountMismatch_ShouldReturnInvalidAmount() {
        // Given
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "10",
                "vnp_Amount", "400000000" // 4,000,000 VND (expected 5,000,000 VND)
        );
        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));

        // When
        Map<String, String> response = depositService.processVnpayWebhook(params);

        // Then
        assertEquals("04", response.get("RspCode"));
        assertEquals("Invalid Amount", response.get("Message"));
        verify(eventRepository, times(1)).save(any(DepositTransactionEvent.class));
        verify(depositRepository, never()).save(any(DepositTransaction.class));
    }

    @Test
    void processVnpayWebhook_PaymentSuccess_ShouldUpdateToPaid() {
        // Given
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "10",
                "vnp_Amount", "500000000",
                "vnp_ResponseCode", "00",
                "vnp_TransactionNo", "VNP123456"
        );
        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));

        // When
        Map<String, String> response = depositService.processVnpayWebhook(params);

        // Then
        assertEquals("00", response.get("RspCode"));
        assertEquals("Confirm Success", response.get("Message"));
        assertEquals(DepositStatus.PAID, transaction.getStatus());
        assertEquals("VNP123456", transaction.getPaymentGatewayRef());
        assertNotNull(transaction.getPaidAt());
        assertNotNull(transaction.getReleaseDeadline());
        verify(depositRepository, times(1)).save(transaction);
        verify(eventRepository, times(1)).save(any(DepositTransactionEvent.class));
    }

    @Test
    void processVnpayWebhook_PaymentFailed_ShouldUpdateToCancelled() {
        // Given
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "10",
                "vnp_Amount", "500000000",
                "vnp_ResponseCode", "24", // Cancelled by customer
                "vnp_TransactionNo", "VNP123456"
        );
        when(vnpayService.verifySignature(params)).thenReturn(true);
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));

        // When
        Map<String, String> response = depositService.processVnpayWebhook(params);

        // Then
        assertEquals("00", response.get("RspCode"));
        assertEquals("Confirm Success", response.get("Message"));
        assertEquals(DepositStatus.CANCELLED, transaction.getStatus());
        verify(depositRepository, times(1)).save(transaction);
        verify(eventRepository, times(1)).save(any(DepositTransactionEvent.class));
    }

    @Test
    void confirmMoveIn_HappyPath_ShouldTransitionToReleasedAndTriggerContractGeneration() {
        // Given
        transaction.setStatus(DepositStatus.PAID);
        DepositResponse mockResponse = DepositResponse.builder()
                .id(10L)
                .status(DepositStatus.RELEASED)
                .build();

        when(userRepository.findByEmail("tenant@example.com")).thenReturn(Optional.of(tenant));
        when(depositRepository.findById(10L)).thenReturn(Optional.of(transaction));
        when(depositRepository.save(any(DepositTransaction.class))).thenReturn(transaction);
        when(depositMapper.toResponse(any(DepositTransaction.class))).thenReturn(mockResponse);

        // When
        DepositResponse response = depositService.confirmMoveIn(10L, "tenant@example.com");

        // Then
        assertNotNull(response);
        assertEquals(DepositStatus.RELEASED, transaction.getStatus());
        assertNotNull(transaction.getReleasedAt());
        verify(rentalContractService, times(1)).generateAndSaveContract(transaction);
        verify(depositRepository, times(1)).save(transaction);
        verify(eventRepository, times(1)).save(any(DepositTransactionEvent.class));
    }

    @Test
    void resolveDispute_ResolveToLandlord_ShouldTransitionToReleasedAndTriggerContractGeneration() {
        // Given
        User admin = User.builder().id(99L).email("admin@example.com").fullName("Admin Admin").build();
        com.rentspace.domain.deposit.DepositDispute dispute = com.rentspace.domain.deposit.DepositDispute.builder()
                .id(100L)
                .transaction(transaction)
                .status(com.rentspace.domain.deposit.enums.DisputeStatus.OPEN)
                .build();
        
        transaction.setStatus(DepositStatus.DISPUTED);
        
        DepositResponse mockResponse = DepositResponse.builder()
                .id(10L)
                .status(DepositStatus.RELEASED)
                .build();

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(disputeRepository.findById(100L)).thenReturn(Optional.of(dispute));
        when(disputeRepository.save(any(com.rentspace.domain.deposit.DepositDispute.class))).thenReturn(dispute);
        when(depositRepository.save(any(DepositTransaction.class))).thenReturn(transaction);
        when(depositMapper.toResponse(any(DepositTransaction.class))).thenReturn(mockResponse);

        // When
        DepositResponse response = depositService.resolveDispute(
                100L, 
                com.rentspace.domain.deposit.enums.DisputeStatus.RESOLVED_LANDLORD, 
                "Dispute resolved in favor of landlord due to tenant no-show", 
                "admin@example.com"
        );

        // Then
        assertNotNull(response);
        assertEquals(DepositStatus.RELEASED, transaction.getStatus());
        assertNotNull(transaction.getReleasedAt());
        verify(rentalContractService, times(1)).generateAndSaveContract(transaction);
        verify(disputeRepository, times(1)).save(dispute);
        verify(depositRepository, times(1)).save(transaction);
    }

    @Test
    void getLandlordSummary_HappyPath_ShouldCalculateCorrectStats() {
        // Given
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        
        DepositTransaction releasedTx1 = DepositTransaction.builder()
                .id(11L)
                .status(DepositStatus.RELEASED)
                .netAmount(3000000L)
                .releasedAt(now.minusDays(2))
                .build();
                
        DepositTransaction releasedTx2 = DepositTransaction.builder()
                .id(12L)
                .status(DepositStatus.RELEASED)
                .netAmount(2000000L)
                .releasedAt(now.minusDays(10))
                .build();

        DepositTransaction pendingTx = DepositTransaction.builder()
                .id(13L)
                .status(DepositStatus.PAID)
                .netAmount(4000000L)
                .build();

        when(userRepository.findByEmail("landlord@example.com")).thenReturn(Optional.of(landlord));
        when(depositRepository.findByLandlordId(landlord.getId())).thenReturn(java.util.List.of(releasedTx1, releasedTx2, pendingTx));

        // When
        LandlordDepositSummary summary = depositService.getLandlordSummary("landlord@example.com");

        // Then
        assertNotNull(summary);
        assertEquals(2, summary.getCompletedCount()); // Only status RELEASED
        assertEquals(5000000L, summary.getTotalNetAmount()); // 3M + 2M
        assertEquals(3000000L, summary.getWeeklyNetAmount()); // Only releasedTx1 (2 days ago)
        assertEquals(5000000L, summary.getMonthlyNetAmount()); // Both releasedTx1 and releasedTx2 (2 and 10 days ago)
    }
}
