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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class VerificationServiceImpl implements VerificationService {

    private final UserRepository userRepository;
    private final UserVerificationRepository verificationRepository;
    private final FptAiEkycClient ekycClient;
    private final NotificationService notificationService;

    @Value("${app.ekyc.confidence-threshold:70.0}")
    private double confidenceThreshold;

    @Value("${app.ekyc.face-match-threshold:70.0}")
    private double faceMatchThreshold;

    @Override
    @Transactional(noRollbackFor = BusinessException.class)
    public VerificationInitResponse submitIdCard(String userEmail, MultipartFile front, MultipartFile back) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userEmail));

        verificationRepository.findByUserId(user.getId()).ifPresent(v -> {
            if (v.getStatus() == VerificationStatus.VERIFIED) {
                throw new BusinessException("Tài khoản đã được xác minh thành công. Không cần xác minh lại.");
            }
        });

        FptAiCardResponse frontResponse;
        try {
            frontResponse = ekycClient.verifyFront(front);
        } catch (Exception e) {
            log.warn("FPT.AI verifyFront thất bại cho user {}: {}", userEmail, e.getMessage());
            saveOrUpdateVerification(user, VerificationStatus.PROCESSING,
                    null, null, null, null, null);
            notifyAdminPendingReview(user);
            throw new BusinessException("Không thể xử lý ảnh CCCD mặt trước. Hồ sơ đã được chuyển sang xét duyệt thủ công.");
        }

        if (!frontResponse.isSuccess()) {
            log.warn("FPT.AI front không thành công cho user {}: errorCode={}, message={}",
                    userEmail, frontResponse.getErrorCode(), frontResponse.getErrorMessage());
            saveOrUpdateVerification(user, VerificationStatus.PROCESSING,
                    null, null, null, null, null);
            notifyAdminPendingReview(user);
            throw new BusinessException("Ảnh CCCD mặt trước không đọc được. Vui lòng chụp lại rõ nét hơn.");
        }

        // Mặt sau: cố gắng gọi nhưng không dừng flow nếu lỗi
        try {
            ekycClient.verifyBack(back);
        } catch (Exception e) {
            log.warn("FPT.AI verifyBack không thành công cho user {} — tiếp tục với dữ liệu mặt trước: {}",
                    userEmail, e.getMessage());
        }

        FptAiCardResponse.CardData cardData = frontResponse.getCardData();
        String maskedId  = maskId(cardData.getId());
        String fullName  = cardData.getName();
        String faceToken = cardData.getFaceToken();
        Double cardConf  = cardData.getConfidence();

        if (faceToken == null || faceToken.isBlank()) {
            log.warn("FPT.AI không trả về faceToken cho user {}", userEmail);
            saveOrUpdateVerification(user, VerificationStatus.PROCESSING,
                    maskedId, fullName,
                    cardConf != null ? BigDecimal.valueOf(cardConf * 100) : null,
                    null, null);
            notifyAdminPendingReview(user);
            throw new BusinessException(
                    "Không trích xuất được khuôn mặt từ CCCD. Hồ sơ đã được chuyển sang xét duyệt thủ công.");
        }

        saveOrUpdateVerification(user, VerificationStatus.PENDING,
                maskedId, fullName,
                cardConf != null ? BigDecimal.valueOf(cardConf * 100) : null,
                null, null);

        log.info("User {} nộp CCCD thành công. maskedId={}", userEmail, maskedId);
        return VerificationInitResponse.builder()
                .faceToken(faceToken)
                .maskedId(maskedId)
                .fullName(fullName)
                .build();
    }

    @Override
    @Transactional
    public VerificationResult submitSelfie(String userEmail, MultipartFile selfie, String faceToken) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userEmail));

        UserVerification verification = verificationRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BusinessException(
                        "Chưa nộp ảnh CCCD. Vui lòng thực hiện Bước 1 trước."));

        if (verification.getStatus() == VerificationStatus.VERIFIED) {
            return VerificationResult.builder()
                    .status("VERIFIED")
                    .message("Tài khoản đã được xác minh thành công trước đó.")
                    .build();
        }

        FptAiFaceMatchResponse matchResponse;
        try {
            matchResponse = ekycClient.matchFace(selfie, faceToken);
        } catch (Exception e) {
            log.warn("FPT.AI matchFace thất bại cho user {}: {}", userEmail, e.getMessage());
            verification.setStatus(VerificationStatus.PROCESSING);
            verificationRepository.save(verification);
            notifyAdminPendingReview(user);
            return VerificationResult.builder()
                    .status("PROCESSING")
                    .message("Hệ thống gặp sự cố khi xác minh khuôn mặt. Hồ sơ đã được chuyển sang xét duyệt thủ công.")
                    .build();
        }

        double similarity = matchResponse.getSimilarityScore();
        boolean isMatch   = matchResponse.isMatch();

        verification.setConfidence(BigDecimal.valueOf(similarity));

        if (!isMatch) {
            String rejectReason = String.format(
                    "Khuôn mặt không khớp với ảnh trên CCCD (độ khớp: %.1f%%).", similarity);
            verification.setStatus(VerificationStatus.REJECTED);
            verification.setRejectionReason(rejectReason);
            verificationRepository.save(verification);

            notificationService.createAndSendNotification(
                    user,
                    "Xác minh danh tính thất bại",
                    "Ảnh selfie không khớp khuôn mặt trên CCCD. Vui lòng thử lại với ảnh rõ nét hơn.",
                    NotificationType.KYC);

            log.info("Verification REJECTED — user={}, similarity={}%, isMatch=false", userEmail, String.format("%.1f", similarity));
            return VerificationResult.builder()
                    .status("REJECTED")
                    .message("Khuôn mặt không khớp CCCD. Vui lòng thử lại với ảnh rõ nét hơn.")
                    .build();
        }

        if (similarity >= faceMatchThreshold) {
            verification.setStatus(VerificationStatus.VERIFIED);
            verification.setVerifiedAt(Instant.now());
            verificationRepository.save(verification);

            notificationService.createAndSendNotification(
                    user,
                    "Xác minh danh tính thành công",
                    String.format("Chúc mừng! Tài khoản của bạn đã được xác minh thành công (độ khớp: %.1f%%).",
                            similarity),
                    NotificationType.KYC);

            log.info("Verification VERIFIED — user={}, similarity={}%", userEmail, String.format("%.1f", similarity));
            return VerificationResult.builder()
                    .status("VERIFIED")
                    .message("Xác minh thành công! Tài khoản của bạn đã được cấp Verified badge.")
                    .build();
        }

        // Độ tin cậy thấp nhưng khuôn mặt vẫn khớp → PROCESSING để Admin xét duyệt
        verification.setStatus(VerificationStatus.PROCESSING);
        verificationRepository.save(verification);
        notifyAdminPendingReview(user);

        log.info("Verification PROCESSING — user={}, similarity={}% < threshold={}%",
                userEmail, String.format("%.1f", similarity), faceMatchThreshold);
        return VerificationResult.builder()
                .status("PROCESSING")
                .message("Hồ sơ đang được Ban quản trị xét duyệt. Chúng tôi sẽ thông báo trong 1–3 ngày làm việc.")
                .build();
    }

    @Override
    @Transactional
    public void manualApprove(Long verificationId, String adminNote) {
        UserVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ xác minh id=" + verificationId));

        if (verification.getStatus() == VerificationStatus.VERIFIED) {
            throw new BusinessException("Hồ sơ đã ở trạng thái VERIFIED.");
        }

        verification.setStatus(VerificationStatus.VERIFIED);
        verification.setVerifiedAt(Instant.now());
        verificationRepository.save(verification);

        notificationService.createAndSendNotification(
                verification.getUser(),
                "Xác minh danh tính được phê duyệt",
                "Hồ sơ xác minh danh tính của bạn đã được Ban quản trị phê duyệt thành công.",
                NotificationType.KYC);

        log.info("Admin phê duyệt verification id={}, userId={}",
                verificationId, verification.getUser().getId());
    }

    @Override
    @Transactional
    public void manualReject(Long verificationId, String reason) {
        UserVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy hồ sơ xác minh id=" + verificationId));

        if (verification.getStatus() == VerificationStatus.VERIFIED) {
            throw new BusinessException("Không thể từ chối hồ sơ đã VERIFIED.");
        }

        verification.setStatus(VerificationStatus.REJECTED);
        verification.setRejectionReason(reason);
        verificationRepository.save(verification);

        notificationService.createAndSendNotification(
                verification.getUser(),
                "Xác minh danh tính bị từ chối",
                "Hồ sơ xác minh của bạn đã bị từ chối. Lý do: " + reason,
                NotificationType.KYC);

        log.info("Admin từ chối verification id={}, lý do: {}", verificationId, reason);
    }

    @Override
    public VerificationStatusDto getStatus(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userEmail));

        return verificationRepository.findByUserId(user.getId())
                .map(v -> VerificationStatusDto.builder()
                        .status(v.getStatus().name())
                        .maskedId(v.getMaskedId())
                        .fullName(v.getFullName())
                        .verifiedAt(v.getVerifiedAt())
                        .rejectionReason(v.getRejectionReason())
                        .build())
                .orElse(VerificationStatusDto.builder()
                        .status("NOT_STARTED")
                        .build());
    }

    @Override
    public List<AdminVerificationItem> getPendingList() {
        return verificationRepository.findAllByStatus(VerificationStatus.PROCESSING).stream()
                .map(v -> AdminVerificationItem.builder()
                        .id(v.getId())
                        .userId(v.getUser().getId())
                        .userEmail(v.getUser().getEmail())
                        .userFullName(v.getUser().getFullName())
                        .status(v.getStatus().name())
                        .maskedId(v.getMaskedId())
                        .fullName(v.getFullName())
                        .confidence(v.getConfidence())
                        .rejectionReason(v.getRejectionReason())
                        .createdAt(v.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ===== Private helpers =====

    private void saveOrUpdateVerification(User user,
                                          VerificationStatus status,
                                          String maskedId,
                                          String fullName,
                                          BigDecimal confidence,
                                          String providerRef,
                                          String rejectionReason) {
        UserVerification v = verificationRepository.findByUserId(user.getId())
                .orElse(UserVerification.builder().user(user).build());

        v.setStatus(status);
        if (maskedId      != null) v.setMaskedId(maskedId);
        if (fullName      != null) v.setFullName(fullName);
        if (confidence    != null) v.setConfidence(confidence);
        if (providerRef   != null) v.setProviderRef(providerRef);
        if (rejectionReason != null) v.setRejectionReason(rejectionReason);

        verificationRepository.save(v);
    }

    private void notifyAdminPendingReview(User user) {
        log.warn("Admin review cần thiết cho verification — userId={}, email={}",
                user.getId(), user.getEmail());
    }

    private String maskId(String id) {
        if (id == null || id.length() < 9) return id;
        int keepStart = 4;
        int keepEnd   = 4;
        String stars  = "*".repeat(id.length() - keepStart - keepEnd);
        return id.substring(0, keepStart) + stars + id.substring(id.length() - keepEnd);
    }
}
