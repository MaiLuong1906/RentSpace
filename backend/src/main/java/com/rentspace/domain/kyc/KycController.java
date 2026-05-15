package com.rentspace.domain.kyc;

import com.rentspace.common.dto.ApiResponse;
import com.rentspace.domain.kyc.dto.KycStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC", description = "Quản lý xác minh danh tính")
public class KycController {

    private final KycService kycService;

    @PostMapping("/submit")
    @Operation(summary = "Nộp hồ sơ KYC (ảnh CCCD)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<String>> submitKyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("cccdImage") MultipartFile cccdImage) {

        // Validate cơ bản
        if (cccdImage.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Vui lòng chọn ảnh CCCD"));
        }
        if (cccdImage.getSize() > 5 * 1024 * 1024) { // 5MB
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Kích thước ảnh tối đa là 5MB"));
        }
        String contentType = cccdImage.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File phải là định dạng ảnh"));
        }

        try {
            kycService.submitKyc(userDetails.getUsername(), cccdImage);
            return ResponseEntity.ok(ApiResponse.success("Nộp hồ sơ KYC thành công, vui lòng chờ duyệt", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/status")
    @Operation(summary = "Kiểm tra trạng thái KYC")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getKycStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        KycStatusResponse response = kycService.getKycStatus(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái KYC thành công", response));
    }
}
