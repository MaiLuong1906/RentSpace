package com.rentspace.domain.kyc;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.kyc.dto.KycReviewItem;
import com.rentspace.domain.kyc.dto.KycStatusResponse;
import com.rentspace.domain.kyc.dto.EkycInitResponse;
import com.rentspace.domain.kyc.dto.EkycCompleteRequest;
import com.rentspace.domain.user.enums.KycStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC", description = "Quản lý xác minh danh tính")
public class KycController {

    private final KycService kycService;

    // ===== USER: Nộp hồ sơ KYC =====
    @PostMapping(value = "/submit", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Nộp hồ sơ KYC (ảnh CCCD)")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<String>> submitKyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("cccdImage") MultipartFile cccdImage) {

        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        if (cccdImage == null || cccdImage.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng chọn ảnh CCCD"));
        }
        if (cccdImage.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Kích thước ảnh tối đa là 5MB"));
        }
        String contentType = cccdImage.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File phải là định dạng ảnh"));
        }

        try {
            kycService.submitKyc(userDetails.getUsername(), cccdImage);
            return ResponseEntity.ok(ApiResponse.success("Nộp hồ sơ KYC thành công, vui lòng chờ duyệt", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== USER: Kiểm tra trạng thái KYC của mình =====
    @GetMapping("/status")
    @Operation(summary = "Kiểm tra trạng thái KYC của bản thân")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getKycStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        KycStatusResponse response = kycService.getKycStatus(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái KYC thành công", response));
    }

    // ===== USER: Khởi tạo phiên eKYC =====
    @PostMapping("/ekyc/init")
    @Operation(summary = "Khởi tạo phiên eKYC")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<EkycInitResponse>> initEkyc(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        try {
            EkycInitResponse response = kycService.initEkyc(userDetails.getUsername());
            return ResponseEntity.ok(ApiResponse.success("Khởi tạo phiên eKYC thành công", response));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== USER: Hoàn tất phiên eKYC =====
    @PostMapping("/ekyc/complete")
    @Operation(summary = "Hoàn tất phiên eKYC")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<KycStatusResponse>> completeEkyc(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EkycCompleteRequest request) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        try {
            KycStatusResponse response = kycService.completeEkyc(userDetails.getUsername(), request);
            return ResponseEntity.ok(ApiResponse.success("Xác thực eKYC hoàn tất", response));
        } catch (IllegalStateException | com.rentspace.common.exception.BusinessException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ===== ADMIN: Lấy danh sách KYC đang chờ duyệt =====
    @GetMapping("/admin/pending")
    @Operation(summary = "[ADMIN] Danh sách hồ sơ KYC đang chờ duyệt")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<KycReviewItem>>> getPendingList() {
        List<KycReviewItem> list = kycService.getPendingKycList();
        return ResponseEntity.ok(ApiResponse.success(
                "Tìm thấy " + list.size() + " hồ sơ đang chờ duyệt", list));
    }

    // ===== ADMIN: Lấy danh sách KYC theo status =====
    @GetMapping("/admin/list")
    @Operation(summary = "[ADMIN] Danh sách hồ sơ KYC theo trạng thái (PENDING/VERIFIED/REJECTED)")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<KycReviewItem>>> getListByStatus(
            @RequestParam(defaultValue = "PENDING") String status) {
        try {
            KycStatus kycStatus = KycStatus.valueOf(status.toUpperCase());
            List<KycReviewItem> list = kycService.getKycListByStatus(kycStatus);
            return ResponseEntity.ok(ApiResponse.success(
                    "Tìm thấy " + list.size() + " hồ sơ với trạng thái " + status, list));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Status không hợp lệ. Dùng: PENDING, VERIFIED, REJECTED"));
        }
    }

    // ===== ADMIN: Duyệt KYC =====
    @PatchMapping("/admin/{userId}/approve")
    @Operation(summary = "[ADMIN] Duyệt hồ sơ KYC")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> approveKyc(@PathVariable Long userId) {
        kycService.approveKyc(userId);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã duyệt KYC cho user id=" + userId, null));
    }

    // ===== ADMIN: Từ chối KYC =====
    @PatchMapping("/admin/{userId}/reject")
    @Operation(summary = "[ADMIN] Từ chối hồ sơ KYC")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> rejectKyc(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "Không đáp ứng yêu cầu") String reason) {
        kycService.rejectKyc(userId, reason);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối KYC cho user id=" + userId, null));
    }
}
