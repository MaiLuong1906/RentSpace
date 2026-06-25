package com.rentspace.domain.verification;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.verification.dto.VerificationInitResponse;
import com.rentspace.domain.verification.dto.VerificationResult;
import com.rentspace.domain.verification.dto.VerificationStatusDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/verification")
@RequiredArgsConstructor
@Tag(name = "Verification API", description = "Xác minh danh tính eKYC (Phase 4)")
@SecurityRequirement(name = "bearerAuth")
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping(value = "/submit-id", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'LANDLORD', 'ADMIN')")
    @Operation(summary = "Bước 1–2: Upload ảnh CCCD 2 mặt")
    public ResponseEntity<ApiResponse<VerificationInitResponse>> submitIdCard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam MultipartFile front,
            @RequestParam MultipartFile back) {

        validateImage(front, "Ảnh mặt trước CCCD");
        validateImage(back, "Ảnh mặt sau CCCD");

        VerificationInitResponse response = verificationService.submitIdCard(
                userDetails.getUsername(), front, back);
        return ResponseEntity.ok(ApiResponse.success("Ảnh CCCD đã được xử lý thành công", response));
    }

    @PostMapping(value = "/submit-face", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('USER', 'LANDLORD', 'ADMIN')")
    @Operation(summary = "Bước 3: Upload selfie để khớp khuôn mặt")
    public ResponseEntity<ApiResponse<VerificationResult>> submitSelfie(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam MultipartFile selfie,
            @RequestParam String faceToken) {

        validateImage(selfie, "Ảnh selfie");
        if (faceToken == null || faceToken.isBlank()) {
            throw new BusinessException("faceToken không được để trống");
        }

        VerificationResult result = verificationService.submitSelfie(
                userDetails.getUsername(), selfie, faceToken);
        return ResponseEntity.ok(ApiResponse.success("Xác minh khuôn mặt hoàn tất", result));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('USER', 'LANDLORD', 'ADMIN')")
    @Operation(summary = "Xem trạng thái xác minh danh tính của bản thân")
    public ResponseEntity<ApiResponse<VerificationStatusDto>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {

        VerificationStatusDto status = verificationService.getStatus(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái xác minh thành công", status));
    }

    private void validateImage(MultipartFile file, String fieldName) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(fieldName + " không được để trống");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BusinessException(fieldName + " không được vượt quá 5MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BusinessException(fieldName + " phải là định dạng ảnh (jpg, png, webp)");
        }
    }
}
