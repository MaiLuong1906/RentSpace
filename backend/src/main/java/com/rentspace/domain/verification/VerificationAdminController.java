package com.rentspace.domain.verification;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.verification.dto.AdminVerificationItem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/verifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin — Verification", description = "Quản lý xác minh danh tính (Admin)")
@SecurityRequirement(name = "bearerAuth")
public class VerificationAdminController {

    private final VerificationService verificationService;

    @GetMapping("/pending")
    @Operation(summary = "Danh sách hồ sơ đang chờ xét duyệt thủ công (PROCESSING)")
    public ResponseEntity<ApiResponse<List<AdminVerificationItem>>> getPendingList() {
        List<AdminVerificationItem> list = verificationService.getPendingList();
        return ResponseEntity.ok(ApiResponse.success(
                "Tìm thấy " + list.size() + " hồ sơ đang chờ duyệt", list));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt hồ sơ xác minh (PROCESSING → VERIFIED)")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "") String adminNote) {

        verificationService.manualApprove(id, adminNote);
        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt hồ sơ xác minh id=" + id, null));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối hồ sơ xác minh với lý do")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long id,
            @RequestParam(defaultValue = "Hồ sơ không đáp ứng yêu cầu xác minh") String reason) {

        verificationService.manualReject(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối hồ sơ xác minh id=" + id, null));
    }
}
