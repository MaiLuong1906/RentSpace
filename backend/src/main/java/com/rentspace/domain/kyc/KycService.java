package com.rentspace.domain.kyc;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.kyc.dto.KycReviewItem;
import com.rentspace.domain.kyc.dto.KycStatusResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.infrastructure.storage.StorageService;
import com.rentspace.infrastructure.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

import com.rentspace.domain.notification.NotificationService;
import com.rentspace.domain.notification.enums.NotificationType;
import com.rentspace.domain.kyc.dto.EkycInitResponse;
import com.rentspace.domain.kyc.dto.EkycCompleteRequest;
import com.rentspace.infrastructure.ekyc.VnptEkycService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycService {

    private final UserRepository userRepository;
    private final StorageService storageService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final VnptEkycService vnptEkycService;
    private final ObjectMapper objectMapper;

    // ===== USER: Nộp hồ sơ KYC =====
    @Transactional
    public void submitKyc(String email, MultipartFile cccdImage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new IllegalStateException("Hồ sơ KYC đã được duyệt, không thể nộp lại.");
        }

        // Xóa ảnh cũ nếu có
        if (user.getCccdImageUrl() != null && !user.getCccdImageUrl().isBlank()) {
            try {
                storageService.deleteFile(user.getCccdImageUrl());
            } catch (Exception e) {
                log.warn("Không thể xóa file cccd cũ: {}", e.getMessage());
            }
        }

        String fileUrl = storageService.uploadFile(cccdImage, "kyc");
        user.setCccdImageUrl(fileUrl);
        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);
        log.info("User {} đã nộp hồ sơ KYC thành công", email);
    }

    // ===== USER: Khởi tạo phiên eKYC =====
    @Transactional
    public EkycInitResponse initEkyc(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new IllegalStateException("Tài khoản của bạn đã được xác minh KYC thành công trước đó.");
        }

        String sessionId = "ekyc_sess_" + UUID.randomUUID().toString().replace("-", "");
        String sdkToken = "mock_vnpt_token_" + UUID.randomUUID().toString().replace("-", "");

        user.setEkycSessionId(sessionId);
        userRepository.save(user);

        log.info("User {} đã khởi tạo phiên eKYC với Session ID: {}", email, sessionId);
        return new EkycInitResponse(sessionId, sdkToken);
    }

    // ===== USER: Hoàn tất phiên eKYC và lưu kết quả =====
    @Transactional
    public KycStatusResponse completeEkyc(String email, EkycCompleteRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new IllegalStateException("Tài khoản của bạn đã được xác minh KYC thành công trước đó.");
        }

        if (user.getEkycSessionId() == null || !user.getEkycSessionId().equals(request.getSessionId())) {
            throw new BusinessException("Phiên xác thực eKYC không hợp lệ hoặc đã hết hạn.");
        }

        // Hủy session ID để chống replay attack
        user.setEkycSessionId(null);

        VnptEkycService.EkycVerificationResult result;
        try {
            result = vnptEkycService.verify(request);
        } catch (Exception e) {
            log.warn("Lỗi kết nối VNPT eKYC, chuyển sang chế độ duyệt MANUAL cho user {}: {}", email, e.getMessage());
            user.setKycStatus(KycStatus.PENDING);
            user.setKycReviewMode("MANUAL");
            String cccdUrl = uploadBase64Image(request.getCccdFrontImage(), "cccd_front", user.getId());
            if (cccdUrl != null) {
                user.setCccdImageUrl(cccdUrl);
            }
            userRepository.save(user);

            emailService.sendKycPendingEmail(user.getEmail(), user.getFullName());
            notificationService.createAndSendNotification(
                    user,
                    "eKYC gặp sự cố - Đã chuyển sang duyệt thủ công",
                    "Hệ thống eKYC gặp sự cố kết nối. Hồ sơ của bạn đã được chuyển sang chế độ duyệt thủ công bởi Ban quản trị.",
                    NotificationType.KYC
            );

            return new KycStatusResponse(
                    KycStatus.PENDING.name(),
                    user.getCccdImageUrl() != null ? storageService.getPresignedUrl(user.getCccdImageUrl()) : null
            );
        }

        BigDecimal confidence = result.getConfidence();
        user.setEkycConfidence(confidence);

        // Upload ảnh CCCD mặt trước
        String cccdUrl = uploadBase64Image(request.getCccdFrontImage(), "cccd_front", user.getId());
        if (cccdUrl != null) {
            if (user.getCccdImageUrl() != null && !user.getCccdImageUrl().isBlank()) {
                try {
                    storageService.deleteFile(user.getCccdImageUrl());
                } catch (Exception ex) {
                    log.warn("Không thể xóa file cccd cũ: {}", ex.getMessage());
                }
            }
            user.setCccdImageUrl(cccdUrl);
        }

        // Lưu thông tin kết quả OCR dưới dạng JSONB
        try {
            user.setEkycResult(objectMapper.writeValueAsString(result.getOcrData()));
        } catch (Exception e) {
            log.warn("Không thể chuyển đổi dữ liệu OCR sang JSON cho user {}: {}", email, e.getMessage());
        }

        // Quy tắc quyết định (Decision Tree)
        if (confidence.compareTo(new BigDecimal("80.00")) >= 0) {
            // Tự động duyệt thành công
            user.setKycStatus(KycStatus.VERIFIED);
            user.setKycReviewMode("AUTO");
            user.setEkycVerifiedAt(java.time.LocalDateTime.now());
            userRepository.save(user);

            log.info("eKYC Duyệt Tự Động thành công cho user: {}, confidence: {}", email, confidence);
            emailService.sendKycResultEmail(user.getEmail(), user.getFullName(), true, null);
            notificationService.createAndSendNotification(
                    user,
                    "Xác thực eKYC thành công",
                    "Tài khoản của bạn đã được xác thực tự động thành công (Độ tin cậy: " + confidence + "%).",
                    NotificationType.KYC
            );
        } else if (confidence.compareTo(new BigDecimal("60.00")) >= 0) {
            // Chuyển duyệt thủ công
            user.setKycStatus(KycStatus.PENDING);
            user.setKycReviewMode("MANUAL");
            userRepository.save(user);

            log.info("eKYC Chuyển Duyệt Thủ Công cho user: {}, confidence: {}", email, confidence);
            emailService.sendKycPendingEmail(user.getEmail(), user.getFullName());
            notificationService.createAndSendNotification(
                    user,
                    "Hồ sơ eKYC đang được xem xét",
                    "Hệ thống eKYC chuyển hồ sơ của bạn sang duyệt thủ công (Độ tin cậy khớp mặt: " + confidence + "%).",
                    NotificationType.KYC
            );
        } else {
            // Tự động từ chối
            user.setKycStatus(KycStatus.REJECTED);
            user.setKycReviewMode("AUTO");
            userRepository.save(user);

            log.info("eKYC Tự Động Từ Chối cho user: {}, confidence: {}", email, confidence);
            emailService.sendKycResultEmail(user.getEmail(), user.getFullName(), false, 
                    "Độ tin cậy khớp mặt quá thấp (" + confidence + "%). Vui lòng thử lại với góc chụp rõ nét hơn.");
            notificationService.createAndSendNotification(
                    user,
                    "Xác thực eKYC thất bại",
                    "Yêu cầu eKYC bị từ chối tự động do ảnh chân dung không trùng khớp thẻ căn cước.",
                    NotificationType.KYC
            );
        }

        return new KycStatusResponse(
                user.getKycStatus().name(),
                user.getCccdImageUrl() != null ? storageService.getPresignedUrl(user.getCccdImageUrl()) : null
        );
    }

    private String uploadBase64Image(String base64Str, String prefix, Long userId) {
        if (base64Str == null || base64Str.isBlank()) {
            return null;
        }
        try {
            String cleanBase64 = base64Str;
            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }
            byte[] bytes = java.util.Base64.getDecoder().decode(cleanBase64.trim());
            String filename = prefix + "_" + userId + "_" + System.currentTimeMillis() + ".jpg";
            return storageService.uploadFile(bytes, filename, "image/jpeg", "kyc");
        } catch (Exception e) {
            log.error("Lỗi parse base64 image cho user id={}: {}", userId, e.getMessage());
            return null;
        }
    }

    // ===== USER: Xem trạng thái KYC của mình =====
    public KycStatusResponse getKycStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        return new KycStatusResponse(
                user.getKycStatus().name(),
                user.getCccdImageUrl() != null ? storageService.getPresignedUrl(user.getCccdImageUrl()) : null
        );
    }

    // ===== ADMIN: Lấy danh sách hồ sơ KYC đang chờ duyệt =====
    public List<KycReviewItem> getPendingKycList() {
        return userRepository.findByKycStatus(KycStatus.PENDING)
                .stream()
                .map(this::toReviewItem)
                .collect(Collectors.toList());
    }

    // ===== ADMIN: Lấy tất cả hồ sơ KYC theo status =====
    public List<KycReviewItem> getKycListByStatus(KycStatus status) {
        return userRepository.findByKycStatus(status)
                .stream()
                .map(this::toReviewItem)
                .collect(Collectors.toList());
    }

    // ===== ADMIN: Duyệt KYC =====
    @Transactional
    public void approveKyc(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user: " + userId));

        if (user.getKycStatus() != KycStatus.PENDING) {
            throw new BusinessException("Chỉ có thể duyệt hồ sơ đang ở trạng thái PENDING. Hiện tại: " + user.getKycStatus());
        }

        user.setKycStatus(KycStatus.VERIFIED);
        userRepository.save(user);
        log.info("Admin đã duyệt KYC cho user id={}, email={}", userId, user.getEmail());
        emailService.sendKycResultEmail(user.getEmail(), user.getFullName(), true, null);
        notificationService.createAndSendNotification(
                user,
                "Hồ sơ KYC được phê duyệt",
                "Chúc mừng! Hồ sơ xác thực thông tin tài khoản (KYC) của bạn đã được duyệt thành công.",
                NotificationType.KYC
        );
    }

    // ===== ADMIN: Từ chối KYC =====
    @Transactional
    public void rejectKyc(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user: " + userId));

        if (user.getKycStatus() != KycStatus.PENDING) {
            throw new BusinessException("Chỉ có thể từ chối hồ sơ đang ở trạng thái PENDING. Hiện tại: " + user.getKycStatus());
        }

        user.setKycStatus(KycStatus.REJECTED);
        userRepository.save(user);
        log.info("Admin đã từ chối KYC cho user id={}, email={}, lý do: {}", userId, user.getEmail(), reason);
        emailService.sendKycResultEmail(user.getEmail(), user.getFullName(), false, reason);
        notificationService.createAndSendNotification(
                user,
                "Hồ sơ KYC bị từ chối",
                "Hồ sơ xác thực thông tin tài khoản (KYC) của bạn đã bị từ chối. Lý do: " + reason,
                NotificationType.KYC
        );
    }

    // ===== Private mapper =====
    private KycReviewItem toReviewItem(User user) {
        return KycReviewItem.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .kycStatus(user.getKycStatus().name())
                .cccdImageUrl(user.getCccdImageUrl() != null ? storageService.getPresignedUrl(user.getCccdImageUrl()) : null)
                .submittedAt(user.getUpdatedAt())
                .build();
    }
}
