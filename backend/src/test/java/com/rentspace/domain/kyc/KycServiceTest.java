package com.rentspace.domain.kyc;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.exception.BusinessException;
import com.rentspace.domain.kyc.dto.KycReviewItem;
import com.rentspace.domain.kyc.dto.KycStatusResponse;
import com.rentspace.domain.kyc.dto.EkycInitResponse;
import com.rentspace.domain.kyc.dto.EkycCompleteRequest;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.infrastructure.storage.StorageService;
import com.rentspace.infrastructure.email.EmailService;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.infrastructure.ekyc.VnptEkycService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private VnptEkycService vnptEkycService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private KycService kycService;

    private com.rentspace.domain.user.User user;

    @BeforeEach
    void setUp() {
        user = com.rentspace.domain.user.User.builder()
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
        com.rentspace.domain.kyc.dto.KycReviewItem item = list.get(0);
        assertEquals("http://presigned-url-mock.com", item.getCccdImageUrl());
        verify(storageService, times(1)).getPresignedUrl("kyc/cccd-123.jpg");
    }

    @Test
    void initEkyc_WhenUserNotVerified_ShouldSetSessionIdAndReturnResponse() {
        // Given
        user.setKycStatus(KycStatus.PENDING);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        EkycInitResponse response = kycService.initEkyc("user@example.com");

        // Then
        assertNotNull(response);
        assertNotNull(response.getSessionId());
        assertTrue(response.getSessionId().startsWith("ekyc_sess_"));
        assertNotNull(response.getSdkToken());
        assertEquals(response.getSessionId(), user.getEkycSessionId());
    }

    @Test
    void initEkyc_WhenUserAlreadyVerified_ShouldThrowIllegalStateException() {
        // Given
        user.setKycStatus(KycStatus.VERIFIED);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        // When & Then
        assertThrows(IllegalStateException.class, () -> kycService.initEkyc("user@example.com"));
    }

    @Test
    void completeEkyc_WhenSuccessMode_ShouldAutoApproveAndSendEmail() {
        // Given
        user.setKycStatus(KycStatus.PENDING);
        user.setEkycSessionId("ekyc_sess_123");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        EkycCompleteRequest request = EkycCompleteRequest.builder()
                .sessionId("ekyc_sess_123")
                .cccdFrontImage("data:image/jpeg;base64,dGVzdF9mcm9udF9pbWFnZQ==")
                .simulationMode("SUCCESS")
                .ocrData(EkycCompleteRequest.OcrData.builder()
                        .idNumber("123456789")
                        .fullName("Nguyen Van A")
                        .build())
                .build();

        VnptEkycService.EkycVerificationResult mockResult = VnptEkycService.EkycVerificationResult.builder()
                .sessionId("ekyc_sess_123")
                .confidence(new BigDecimal("92.45"))
                .isSuccess(true)
                .reason("Face matched successfully")
                .ocrData(request.getOcrData())
                .build();

        when(vnptEkycService.verify(any(EkycCompleteRequest.class))).thenReturn(mockResult);
        when(storageService.uploadFile(any(byte[].class), anyString(), anyString(), anyString())).thenReturn("kyc/cccd-123.jpg");
        when(storageService.getPresignedUrl("kyc/cccd-123.jpg")).thenReturn("http://presigned-url.com");

        // When
        KycStatusResponse response = kycService.completeEkyc("user@example.com", request);

        // Then
        assertNotNull(response);
        assertEquals("VERIFIED", response.getStatus());
        assertEquals("http://presigned-url.com", response.getCccdImageUrl());
        assertNull(user.getEkycSessionId()); // Verified: session cleared
        assertEquals(new BigDecimal("92.45"), user.getEkycConfidence());
        assertEquals("AUTO", user.getKycReviewMode());
        assertNotNull(user.getEkycVerifiedAt());

        verify(emailService, times(1)).sendKycResultEmail("user@example.com", "Nguyen Van A", true, null);
        verify(notificationService, times(1)).createAndSendNotification(eq(user), anyString(), anyString(), any());
    }

    @Test
    void completeEkyc_WhenLowConfidence_ShouldFallbackToManualPending() {
        // Given
        user.setKycStatus(KycStatus.PENDING);
        user.setEkycSessionId("ekyc_sess_123");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        EkycCompleteRequest request = EkycCompleteRequest.builder()
                .sessionId("ekyc_sess_123")
                .cccdFrontImage("dGVzdF9mcm9udF9pbWFnZQ==")
                .simulationMode("NEED_REVIEW")
                .ocrData(EkycCompleteRequest.OcrData.builder()
                        .idNumber("123456789")
                        .fullName("Nguyen Van A")
                        .build())
                .build();

        VnptEkycService.EkycVerificationResult mockResult = VnptEkycService.EkycVerificationResult.builder()
                .sessionId("ekyc_sess_123")
                .confidence(new BigDecimal("71.20"))
                .isSuccess(true)
                .reason("Face match low confidence")
                .ocrData(request.getOcrData())
                .build();

        when(vnptEkycService.verify(any(EkycCompleteRequest.class))).thenReturn(mockResult);
        when(storageService.uploadFile(any(byte[].class), anyString(), anyString(), anyString())).thenReturn("kyc/cccd-123.jpg");
        when(storageService.getPresignedUrl("kyc/cccd-123.jpg")).thenReturn("http://presigned-url.com");

        // When
        KycStatusResponse response = kycService.completeEkyc("user@example.com", request);

        // Then
        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals("MANUAL", user.getKycReviewMode());
        assertEquals(new BigDecimal("71.20"), user.getEkycConfidence());

        verify(emailService, times(1)).sendKycPendingEmail("user@example.com", "Nguyen Van A");
        verify(notificationService, times(1)).createAndSendNotification(eq(user), anyString(), anyString(), any());
    }

    @Test
    void completeEkyc_WhenFailMode_ShouldAutoReject() {
        // Given
        user.setKycStatus(KycStatus.PENDING);
        user.setEkycSessionId("ekyc_sess_123");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        EkycCompleteRequest request = EkycCompleteRequest.builder()
                .sessionId("ekyc_sess_123")
                .cccdFrontImage("dGVzdF9mcm9udF9pbWFnZQ==")
                .simulationMode("FAIL")
                .build();

        VnptEkycService.EkycVerificationResult mockResult = VnptEkycService.EkycVerificationResult.builder()
                .sessionId("ekyc_sess_123")
                .confidence(new BigDecimal("42.50"))
                .isSuccess(false)
                .reason("Face mismatch")
                .build();

        when(vnptEkycService.verify(any(EkycCompleteRequest.class))).thenReturn(mockResult);
        when(storageService.uploadFile(any(byte[].class), anyString(), anyString(), anyString())).thenReturn("kyc/cccd-123.jpg");
        when(storageService.getPresignedUrl("kyc/cccd-123.jpg")).thenReturn("http://presigned-url.com");

        // When
        KycStatusResponse response = kycService.completeEkyc("user@example.com", request);

        // Then
        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        assertEquals("AUTO", user.getKycReviewMode());
        assertEquals(new BigDecimal("42.50"), user.getEkycConfidence());

        verify(emailService, times(1)).sendKycResultEmail(eq("user@example.com"), eq("Nguyen Van A"), eq(false), anyString());
        verify(notificationService, times(1)).createAndSendNotification(eq(user), anyString(), anyString(), any());
    }

    @Test
    void completeEkyc_WhenSessionIdMismatch_ShouldThrowBusinessException() {
        // Given
        user.setKycStatus(KycStatus.PENDING);
        user.setEkycSessionId("ekyc_sess_actual");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        EkycCompleteRequest request = EkycCompleteRequest.builder()
                .sessionId("ekyc_sess_fake")
                .build();

        // When & Then
        assertThrows(BusinessException.class, () -> kycService.completeEkyc("user@example.com", request));
    }
}
