package com.rentspace.domain.contract;

import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.listing.Listing;
import com.rentspace.domain.user.User;
import com.rentspace.infrastructure.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalContractServiceTest {

    @Mock
    private RentalContractRepository contractRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private RentalContractService rentalContractService;

    private User tenant;
    private User landlord;
    private Listing listing;
    private DepositTransaction transaction;

    @BeforeEach
    void setUp() {
        tenant = User.builder()
                .id(1L)
                .email("tenant@example.com")
                .fullName("Nguyen Van Tenant")
                .phoneNumber("0987654321")
                .build();

        landlord = User.builder()
                .id(2L)
                .email("landlord@example.com")
                .fullName("Tran Van Landlord")
                .phoneNumber("0912345678")
                .build();

        listing = Listing.builder()
                .id(100L)
                .title("Can ho cao cap EcoGreen")
                .address("123 Nguyen Huu Tho, Quan 7, TP.HCM")
                .pricePerMonth(new BigDecimal("5000000"))
                .landlord(landlord)
                .build();

        transaction = DepositTransaction.builder()
                .id(10L)
                .listing(listing)
                .tenant(tenant)
                .landlord(landlord)
                .amount(5000000L)
                .moveInDate(LocalDate.now().plusDays(5))
                .build();
    }

    @Test
    void generateAndSaveContract_HappyPath_ShouldGeneratePDFAndSaveMetadata() {
        // Given
        String mockContractUrl = "http://localhost:8080/uploads/contracts/mock_contract_10.pdf";
        
        when(storageService.uploadFile(any(byte[].class), any(String.class), any(String.class), any(String.class))).thenReturn(mockContractUrl);
        
        when(contractRepository.save(any(RentalContract.class))).thenAnswer(invocation -> {
            RentalContract arg = invocation.getArgument(0);
            arg.setId(50L);
            return arg;
        });

        // When
        RentalContract result = rentalContractService.generateAndSaveContract(transaction);

        // Then
        assertNotNull(result);
        assertEquals(50L, result.getId());
        assertEquals(mockContractUrl, result.getContractUrl());
        assertEquals(5000000L, result.getDepositAmount());
        assertEquals(5000000L, result.getMonthlyRent());
        assertEquals(transaction.getId(), result.getTransaction().getId());
        assertEquals(tenant.getId(), result.getTenant().getId());
        assertEquals(landlord.getId(), result.getLandlord().getId());
        assertEquals(listing.getId(), result.getListing().getId());

        // Verify storage upload was called with some bytes
        ArgumentCaptor<byte[]> bytesCaptor = ArgumentCaptor.forClass(byte[].class);
        ArgumentCaptor<String> filenameCaptor = ArgumentCaptor.forClass(String.class);
        verify(storageService, times(1)).uploadFile(
                bytesCaptor.capture(), 
                filenameCaptor.capture(), 
                eq("application/pdf"), 
                eq("contracts")
        );
        
        byte[] pdfBytes = bytesCaptor.getValue();
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        assertTrue(filenameCaptor.getValue().contains("contract_10.pdf"));

        // Verify repository save was called
        verify(contractRepository, times(1)).save(any(RentalContract.class));
    }
}
