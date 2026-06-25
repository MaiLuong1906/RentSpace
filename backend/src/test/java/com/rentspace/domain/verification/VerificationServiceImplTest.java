package com.rentspace.domain.verification;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.verification.dto.AdminVerificationItem;
import com.rentspace.domain.verification.dto.VerificationInitResponse;
import com.rentspace.domain.verification.dto.VerificationResult;
import com.rentspace.domain.verification.dto.VerificationStatusDto;
import com.rentspace.infrastructure.ekyc.FptAiEkycClient;
import com.rentspace.infrastructure.ekyc.dto.FptAiCardResponse;
import com.rentspace.infrastructure.ekyc.dto.FptAiFaceMatchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserVerificationRepository verificationRepository;

    @Mock
    private FptAiEkycClient ekycClient;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private VerificationServiceImpl service;

    private com.rentspace.domain.user.User user;
    private MockMultipartFile frontImage;
    private MockMultipartFile backImage;
    private MockMultipartFile selfieImage;

    @BeforeEach
    void setUp() {
        // Inject @Value fields mà Mockito không inject được
        ReflectionTestUtils.setField(service, "confidenceThreshold", 70.0);
        ReflectionTestUtils.setField(service, "faceMatchThreshold", 70.0);

        user = com.rentspace.domain.user.User.builder()
                .id(1L)
                .email("user@example.com")
                .fullName("Nguyen Van A")
                .build();

        frontImage = new MockMultipartFile("front", "front.jpg", "image/jpeg", "fake-front-bytes".getBytes());
        backImage  = new MockMultipartFile("back",  "back.jpg",  "image/jpeg", "fake-back-bytes".getBytes());
        selfieImage = new MockMultipartFile("selfie", "selfie.jpg", "image/jpeg", "fake-selfie-bytes".getBytes());
    }

    // =====================================================================
    // submitIdCard
    // =====================================================================

    @Nested
    class SubmitIdCard {

        @Test
        void whenFptAiReturnsSuccess_shouldReturnFaceTokenAndSavePending() {
            // Given
            FptAiCardResponse.CardData cardData = new FptAiCardResponse.CardData();
            cardData.setId("079123456789");
            cardData.setName("NGUYEN VAN A");
            cardData.setFaceToken("face_tok_abc123");
            cardData.setConfidence(0.9954);

            FptAiCardResponse frontResponse = new FptAiCardResponse();
            frontResponse.setErrorCode(0);
            frontResponse.setErrorMessage("DONE");
            frontResponse.setData(List.of(cardData));

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(ekycClient.verifyFront(frontImage)).thenReturn(frontResponse);
            when(ekycClient.verifyBack(backImage)).thenReturn(frontResponse);
            when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When
            VerificationInitResponse result = service.submitIdCard("user@example.com", frontImage, backImage);

            // Then
            assertThat(result.getFaceToken()).isEqualTo("face_tok_abc123");
            assertThat(result.getMaskedId()).isEqualTo("0791****6789");
            assertThat(result.getFullName()).isEqualTo("NGUYEN VAN A");
            verify(verificationRepository).save(argThat(v ->
                    v.getStatus() == VerificationStatus.PENDING
                    && "0791****6789".equals(v.getMaskedId())
            ));
        }

        @Test
        void whenUserAlreadyVerified_shouldThrowBusinessException() {
            // Given
            UserVerification verified = UserVerification.builder()
                    .user(user)
                    .status(VerificationStatus.VERIFIED)
                    .build();

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(verified));

            // When & Then
            assertThatThrownBy(() -> service.submitIdCard("user@example.com", frontImage, backImage))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("đã được xác minh");
        }

        @Test
        void whenFptAiThrowsException_shouldSaveProcessingAndThrowBusinessException() {
            // Given
            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(ekycClient.verifyFront(any())).thenThrow(new RuntimeException("Connection refused"));
            when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When & Then
            assertThatThrownBy(() -> service.submitIdCard("user@example.com", frontImage, backImage))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("xét duyệt thủ công");

            // DB record vẫn được lưu với status PROCESSING
            verify(verificationRepository).save(argThat(v -> v.getStatus() == VerificationStatus.PROCESSING));
        }

        @Test
        void whenFptAiReturnsErrorCode_shouldSaveProcessingAndThrowBusinessException() {
            // Given
            FptAiCardResponse errorResponse = new FptAiCardResponse();
            errorResponse.setErrorCode(1);
            errorResponse.setErrorMessage("Image quality too low");

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(ekycClient.verifyFront(any())).thenReturn(errorResponse);
            when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When & Then
            assertThatThrownBy(() -> service.submitIdCard("user@example.com", frontImage, backImage))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("không đọc được");

            verify(verificationRepository).save(argThat(v -> v.getStatus() == VerificationStatus.PROCESSING));
        }

        @Test
        void whenFaceTokenMissing_shouldSaveProcessingAndThrowBusinessException() {
            // Given — FPT.AI trả về data nhưng không có faceToken
            FptAiCardResponse.CardData cardData = new FptAiCardResponse.CardData();
            cardData.setId("079123456789");
            cardData.setName("NGUYEN VAN A");
            cardData.setFaceToken(null); // thiếu faceToken
            cardData.setConfidence(0.95);

            FptAiCardResponse frontResponse = new FptAiCardResponse();
            frontResponse.setErrorCode(0);
            frontResponse.setErrorMessage("DONE");
            frontResponse.setData(List.of(cardData));

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());
            when(ekycClient.verifyFront(any())).thenReturn(frontResponse);
            when(ekycClient.verifyBack(any())).thenReturn(frontResponse);
            when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When & Then
            assertThatThrownBy(() -> service.submitIdCard("user@example.com", frontImage, backImage))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("khuôn mặt");

            verify(verificationRepository).save(argThat(v -> v.getStatus() == VerificationStatus.PROCESSING));
        }

        @Test
        void whenUserNotFound_shouldThrowResourceNotFoundException() {
            // Given
            when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> service.submitIdCard("notfound@example.com", frontImage, backImage))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =====================================================================
    // submitSelfie
    // =====================================================================

    @Nested
    class SubmitSelfie {

        private UserVerification pendingVerification;

        @BeforeEach
        void setUpVerification() {
            pendingVerification = UserVerification.builder()
                    .id(10L)
                    .user(user)
                    .status(VerificationStatus.PENDING)
                    .maskedId("0791****6789")
                    .fullName("NGUYEN VAN A")
                    .build();

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            lenient().when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(pendingVerification));
            lenient().when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }

        @Test
        void whenSimilarityHighAndIsMatch_shouldReturnVerified() {
            // Given — similarity=92% và isMatch=true → VERIFIED
            FptAiFaceMatchResponse.FaceMatchData matchData = new FptAiFaceMatchResponse.FaceMatchData();
            matchData.setIsMatch("true");
            matchData.setSimilarity("92.17");

            FptAiFaceMatchResponse matchResponse = new FptAiFaceMatchResponse();
            matchResponse.setCode(200);
            matchResponse.setData(matchData);

            when(ekycClient.matchFace(selfieImage, "face_tok_abc")).thenReturn(matchResponse);

            // When
            VerificationResult result = service.submitSelfie("user@example.com", selfieImage, "face_tok_abc");

            // Then
            assertThat(result.getStatus()).isEqualTo("VERIFIED");
            assertThat(result.getMessage()).contains("thành công");
            assertThat(pendingVerification.getStatus()).isEqualTo(VerificationStatus.VERIFIED);
            assertThat(pendingVerification.getVerifiedAt()).isNotNull();
            assertThat(pendingVerification.getConfidence()).isEqualByComparingTo(new BigDecimal("92.17"));

            verify(notificationService).createAndSendNotification(
                    eq(user), anyString(), anyString(), eq(NotificationType.KYC));
        }

        @Test
        void whenSimilarityLowButIsMatch_shouldReturnProcessing() {
            // Given — similarity=65% và isMatch=true → PROCESSING (admin review)
            FptAiFaceMatchResponse.FaceMatchData matchData = new FptAiFaceMatchResponse.FaceMatchData();
            matchData.setIsMatch("true");
            matchData.setSimilarity("65.00");

            FptAiFaceMatchResponse matchResponse = new FptAiFaceMatchResponse();
            matchResponse.setCode(200);
            matchResponse.setData(matchData);

            when(ekycClient.matchFace(selfieImage, "face_tok_abc")).thenReturn(matchResponse);

            // When
            VerificationResult result = service.submitSelfie("user@example.com", selfieImage, "face_tok_abc");

            // Then
            assertThat(result.getStatus()).isEqualTo("PROCESSING");
            assertThat(pendingVerification.getStatus()).isEqualTo(VerificationStatus.PROCESSING);
            assertThat(pendingVerification.getConfidence()).isEqualByComparingTo(new BigDecimal("65.0"));
        }

        @Test
        void whenIsMatchFalse_shouldReturnRejected() {
            // Given — isMatch=false → REJECTED ngay lập tức
            FptAiFaceMatchResponse.FaceMatchData matchData = new FptAiFaceMatchResponse.FaceMatchData();
            matchData.setIsMatch("false");
            matchData.setSimilarity("32.50");

            FptAiFaceMatchResponse matchResponse = new FptAiFaceMatchResponse();
            matchResponse.setCode(200);
            matchResponse.setData(matchData);

            when(ekycClient.matchFace(selfieImage, "face_tok_abc")).thenReturn(matchResponse);

            // When
            VerificationResult result = service.submitSelfie("user@example.com", selfieImage, "face_tok_abc");

            // Then
            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(pendingVerification.getStatus()).isEqualTo(VerificationStatus.REJECTED);
            assertThat(pendingVerification.getRejectionReason()).contains("không khớp");

            verify(notificationService).createAndSendNotification(
                    eq(user), anyString(), anyString(), eq(NotificationType.KYC));
        }

        @Test
        void whenFptAiMatchThrowsException_shouldReturnProcessing() {
            // Given — API timeout → fallback PROCESSING
            when(ekycClient.matchFace(any(), anyString()))
                    .thenThrow(new RuntimeException("Gateway timeout"));

            // When
            VerificationResult result = service.submitSelfie("user@example.com", selfieImage, "face_tok_abc");

            // Then
            assertThat(result.getStatus()).isEqualTo("PROCESSING");
            assertThat(result.getMessage()).contains("sự cố");
            assertThat(pendingVerification.getStatus()).isEqualTo(VerificationStatus.PROCESSING);
        }

        @Test
        void whenAlreadyVerified_shouldReturnVerifiedImmediately() {
            // Given — không cần gọi FPT.AI nếu đã VERIFIED
            pendingVerification.setStatus(VerificationStatus.VERIFIED);

            // When
            VerificationResult result = service.submitSelfie("user@example.com", selfieImage, "face_tok_abc");

            // Then
            assertThat(result.getStatus()).isEqualTo("VERIFIED");
            verifyNoInteractions(ekycClient);
        }

        @Test
        void whenNoVerificationRecord_shouldThrowBusinessException() {
            // Given — chưa nộp CCCD ở bước 1
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> service.submitSelfie("user@example.com", selfieImage, "tok"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Bước 1");
        }
    }

    // =====================================================================
    // manualApprove / manualReject
    // =====================================================================

    @Nested
    class AdminActions {

        private UserVerification processingVerification;

        @BeforeEach
        void setUpVerification() {
            processingVerification = UserVerification.builder()
                    .id(10L)
                    .user(user)
                    .status(VerificationStatus.PROCESSING)
                    .maskedId("0791****6789")
                    .build();
        }

        @Test
        void manualApprove_whenProcessing_shouldSetVerifiedAndNotify() {
            // Given
            when(verificationRepository.findById(10L)).thenReturn(Optional.of(processingVerification));
            when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When
            service.manualApprove(10L, "OK");

            // Then
            assertThat(processingVerification.getStatus()).isEqualTo(VerificationStatus.VERIFIED);
            assertThat(processingVerification.getVerifiedAt()).isNotNull();
            verify(notificationService).createAndSendNotification(
                    eq(user), anyString(), anyString(), eq(NotificationType.KYC));
        }

        @Test
        void manualApprove_whenAlreadyVerified_shouldThrowBusinessException() {
            // Given
            processingVerification.setStatus(VerificationStatus.VERIFIED);
            when(verificationRepository.findById(10L)).thenReturn(Optional.of(processingVerification));

            // When & Then
            assertThatThrownBy(() -> service.manualApprove(10L, ""))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("VERIFIED");
        }

        @Test
        void manualReject_whenProcessing_shouldSetRejectedWithReasonAndNotify() {
            // Given
            when(verificationRepository.findById(10L)).thenReturn(Optional.of(processingVerification));
            when(verificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // When
            service.manualReject(10L, "Ảnh không rõ nét");

            // Then
            assertThat(processingVerification.getStatus()).isEqualTo(VerificationStatus.REJECTED);
            assertThat(processingVerification.getRejectionReason()).isEqualTo("Ảnh không rõ nét");
            verify(notificationService).createAndSendNotification(
                    eq(user), anyString(), contains("Ảnh không rõ nét"), eq(NotificationType.KYC));
        }

        @Test
        void manualReject_whenVerificationNotFound_shouldThrowResourceNotFoundException() {
            // Given
            when(verificationRepository.findById(99L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> service.manualReject(99L, "reason"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // =====================================================================
    // getStatus / getPendingList
    // =====================================================================

    @Nested
    class QueryMethods {

        @Test
        void getStatus_whenVerified_shouldReturnVerifiedDto() {
            // Given
            UserVerification verified = UserVerification.builder()
                    .user(user)
                    .status(VerificationStatus.VERIFIED)
                    .maskedId("0791****6789")
                    .fullName("NGUYEN VAN A")
                    .verifiedAt(Instant.now())
                    .build();

            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.of(verified));

            // When
            VerificationStatusDto dto = service.getStatus("user@example.com");

            // Then
            assertThat(dto.getStatus()).isEqualTo("VERIFIED");
            assertThat(dto.getMaskedId()).isEqualTo("0791****6789");
            assertThat(dto.getVerifiedAt()).isNotNull();
        }

        @Test
        void getStatus_whenNoRecord_shouldReturnNotStarted() {
            // Given
            when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
            when(verificationRepository.findByUserId(1L)).thenReturn(Optional.empty());

            // When
            VerificationStatusDto dto = service.getStatus("user@example.com");

            // Then
            assertThat(dto.getStatus()).isEqualTo("NOT_STARTED");
        }

        @Test
        void getPendingList_shouldReturnAllProcessingRecords() {
            // Given
            UserVerification v1 = UserVerification.builder()
                    .id(1L).user(user).status(VerificationStatus.PROCESSING)
                    .maskedId("0791****0001").confidence(new BigDecimal("65.0"))
                    .createdAt(Instant.now()).build();

            com.rentspace.domain.user.User user2 = com.rentspace.domain.user.User.builder()
                    .id(2L).email("user2@example.com").fullName("Tran Thi B").build();

            UserVerification v2 = UserVerification.builder()
                    .id(2L).user(user2).status(VerificationStatus.PROCESSING)
                    .maskedId("0791****0002").confidence(new BigDecimal("68.5"))
                    .createdAt(Instant.now()).build();

            when(verificationRepository.findAllByStatus(VerificationStatus.PROCESSING))
                    .thenReturn(List.of(v1, v2));

            // When
            List<AdminVerificationItem> list = service.getPendingList();

            // Then
            assertThat(list).hasSize(2);
            assertThat(list.get(0).getUserEmail()).isEqualTo("user@example.com");
            assertThat(list.get(1).getUserEmail()).isEqualTo("user2@example.com");
            assertThat(list.get(0).getStatus()).isEqualTo("PROCESSING");
        }
    }
}
