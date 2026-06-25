package com.rentspace.domain.user;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.user.dto.PublicProfileResponse;
import com.rentspace.domain.user.dto.UpdateProfileRequest;
import com.rentspace.domain.user.dto.UserProfileResponse;
import com.rentspace.domain.verification.UserVerification;
import com.rentspace.domain.verification.UserVerificationRepository;
import com.rentspace.domain.verification.VerificationStatus;
import com.rentspace.infrastructure.storage.StorageService;

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final StorageService storageService;
    private final UserVerificationRepository verificationRepository;

    // ===== GET /api/v1/users/me =====
    public UserProfileResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));
        return mapToUserProfileResponse(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));
    }

    // ===== PUT /api/v1/users/me =====
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));

        if (StringUtils.hasText(request.getFullName())) {
            user.setFullName(request.getFullName());
        }
        if (StringUtils.hasText(request.getPhoneNumber())) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        User saved = userRepository.save(user);
        log.info("Cập nhật hồ sơ thành công cho user: {}", email);
        return mapToUserProfileResponse(saved);
    }

    // ===== PATCH /api/v1/users/me/avatar =====
    @Transactional
    public UserProfileResponse updateAvatar(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File ảnh không được để trống");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException("Chỉ chấp nhận file ảnh (jpg, png, webp, ...)");
        }

        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            throw new BusinessException("Kích thước ảnh không được vượt quá 5MB");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));

        // Xóa avatar cũ nếu có
        if (StringUtils.hasText(user.getAvatarUrl())) {
            try {
                storageService.deleteFile(user.getAvatarUrl());
            } catch (Exception e) {
                log.warn("Không thể xóa avatar cũ, bỏ qua: {}", e.getMessage());
            }
        }

        String newAvatarUrl = storageService.uploadFile(file, "avatars");
        user.setAvatarUrl(newAvatarUrl);

        User saved = userRepository.save(user);
        log.info("Cập nhật avatar thành công cho user: {}", email);
        return mapToUserProfileResponse(saved);
    }

    // ===== GET /api/v1/users/{id} =====
    public PublicProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + userId));
        return mapToPublicProfileResponse(user);
    }

    // ===== Dùng nội bộ (Dev/Admin) =====
    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + userId));
        return mapToUserProfileResponse(user);
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserProfileResponse)
                .collect(Collectors.toList());
    }

    // ===== Private Mappers =====
    private UserProfileResponse mapToUserProfileResponse(User user) {
        UserVerification verification = verificationRepository.findByUserId(user.getId()).orElse(null);
        boolean isVerified = verification != null && verification.getStatus() == VerificationStatus.VERIFIED;
        String verificationStatus = verification != null ? verification.getStatus().name() : "NOT_STARTED";

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .kycStatus(user.getKycStatus())
                .isEmailVerified(user.getIsEmailVerified())
                .createdAt(user.getCreatedAt())
                .isVerified(isVerified)
                .verificationStatus(verificationStatus)
                .build();
    }

    private PublicProfileResponse mapToPublicProfileResponse(User user) {
        boolean isVerified = verificationRepository.findByUserId(user.getId())
                .map(v -> v.getStatus() == VerificationStatus.VERIFIED)
                .orElse(false);

        return PublicProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .isVerified(isVerified)
                .build();
    }
}
