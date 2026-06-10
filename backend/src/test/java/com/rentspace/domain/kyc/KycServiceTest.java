package com.rentspace.domain.kyc;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.kyc.dto.KycReviewItem;
import com.rentspace.domain.kyc.dto.KycStatusResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.infrastructure.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private KycService kycService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Nguyen Van A")
                .kycStatus(KycStatus.PENDING)
                .cccdImageUrl("kyc/cccd-123.jpg")
                .build();
    }

    @Test
    void getKycStatus_WhenUserExistsAndHasImage_ShouldReturnPresignedUrl() {
        // Given
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(storageService.getPresignedUrl("kyc/cccd-123.jpg")).thenReturn("http://presigned-url-mock.com");

        // When
        com.rentspace.domain.kyc.dto.KycStatusResponse response = kycService.getKycStatus("user@example.com");

        // Then
        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals("http://presigned-url-mock.com", response.getCccdImageUrl());
        verify(storageService, times(1)).getPresignedUrl("kyc/cccd-123.jpg");
    }

    @Test
    void getKycStatus_WhenUserExistsAndNoImage_ShouldReturnNullImageUrl() {
        // Given
        user.setCccdImageUrl(null);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        // When
        com.rentspace.domain.kyc.dto.KycStatusResponse response = kycService.getKycStatus("user@example.com");

        // Then
        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertNull(response.getCccdImageUrl());
        verify(storageService, never()).getPresignedUrl(anyString());
    }

    @Test
    void getPendingKycList_ShouldReturnPresignedUrls() {
        // Given
        when(userRepository.findByKycStatus(KycStatus.PENDING)).thenReturn(List.of(user));
        when(storageService.getPresignedUrl("kyc/cccd-123.jpg")).thenReturn("http://presigned-url-mock.com");

        // When
        List<com.rentspace.domain.kyc.dto.KycReviewItem> list = kycService.getPendingKycList();

        // Then
        assertNotNull(list);
        assertEquals(1, list.size());
        KycReviewItem item = list.get(0);
        assertEquals("http://presigned-url-mock.com", item.getCccdImageUrl());
        verify(storageService, times(1)).getPresignedUrl("kyc/cccd-123.jpg");
    }
}
