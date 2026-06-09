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

@Service
@RequiredArgsConstructor
@Slf4j
public class KycService {

    private final UserRepository userRepository;
    private final StorageService storageService;
    private final EmailService emailService;
    private final NotificationService notificationService;

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
