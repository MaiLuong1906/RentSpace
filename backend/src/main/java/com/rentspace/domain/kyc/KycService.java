package com.rentspace.domain.kyc;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.kyc.dto.KycStatusResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import com.rentspace.domain.user.enums.KycStatus;
import com.rentspace.infrastructure.storage.S3StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class KycService {

    private final UserRepository userRepository;
    private final S3StorageService storageService;

    @Transactional
    public void submitKyc(String email, MultipartFile cccdImage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        if (user.getKycStatus() == KycStatus.APPROVED) {
            throw new IllegalStateException("Hồ sơ KYC đã được duyệt, không thể nộp lại.");
        }

        // Tải ảnh mới lên S3
        String fileUrl = storageService.uploadFile(cccdImage, "kyc");

        // Xóa ảnh cũ nếu có (Tránh rác S3)
        if (user.getCccdImageUrl() != null && !user.getCccdImageUrl().isBlank()) {
            try {
                storageService.deleteFile(user.getCccdImageUrl());
            } catch (Exception e) {
                log.warn("Không thể xóa file cccd cũ trên S3: {}", e.getMessage());
            }
        }

        // Cập nhật trạng thái và URL
        user.setCccdImageUrl(fileUrl);
        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);
    }

    public KycStatusResponse getKycStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
        
        return new KycStatusResponse(
                user.getKycStatus().name(), 
                user.getCccdImageUrl()
        );
    }
}
