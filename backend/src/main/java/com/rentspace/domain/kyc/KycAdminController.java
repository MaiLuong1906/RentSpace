package com.rentspace.domain.kyc;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.kyc.dto.KycReviewItem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/kyc")
@RequiredArgsConstructor
@Tag(name = "Admin KYC", description = "API quản trị phê duyệt KYC")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class KycAdminController {

    private final KycService kycService;

    // ===== GET /api/v1/admin/kyc =====
    @GetMapping
    @Operation(summary = "[ADMIN] Lấy danh sách hồ sơ KYC chờ duyệt")
    public ResponseEntity<ApiResponse<List<KycReviewItem>>> getPendingKyc() {
        List<KycReviewItem> list = kycService.getPendingKycList();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách KYC chờ duyệt thành công", list));
    }

    // ===== PATCH /api/v1/admin/kyc/{id}/approve =====
    @PatchMapping("/{id}/approve")
    @Operation(summary = "[ADMIN] Phê duyệt hồ sơ KYC của người dùng")
    public ResponseEntity<ApiResponse<String>> approveKyc(@PathVariable Long id) {
        kycService.approveKyc(id);
        return ResponseEntity.ok(ApiResponse.success("Đã duyệt KYC cho user id=" + id, null));
    }

    // ===== PATCH /api/v1/admin/kyc/{id}/reject =====
    @PatchMapping("/{id}/reject")
    @Operation(summary = "[ADMIN] Từ chối hồ sơ KYC của người dùng kèm theo lý do")
    public ResponseEntity<ApiResponse<String>> rejectKyc(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Không đáp ứng yêu cầu") String reason) {
        kycService.rejectKyc(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối KYC cho user id=" + id, null));
    }
}
