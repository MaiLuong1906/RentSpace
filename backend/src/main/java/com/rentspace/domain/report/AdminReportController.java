package com.rentspace.domain.report;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.report.dto.ReportResponse;
import com.rentspace.domain.report.dto.ReportStatusUpdateRequest;
import com.rentspace.domain.report.enums.ReportStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller phục vụ Admin quản lý và xử lý báo cáo vi phạm phòng trọ.
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Reports", description = "Quản lý báo cáo dành cho Admin")
@SecurityRequirement(name = "bearerAuth")
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    @Operation(summary = "[ADMIN] Lấy danh sách báo cáo vi phạm phân trang")
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> getReports(
            @RequestParam(required = false) ReportStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReportResponse> reports = reportService.getReports(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "[ADMIN] Cập nhật trạng thái xử lý báo cáo (RESOLVED/DISMISSED)")
    public ResponseEntity<ApiResponse<ReportResponse>> updateReportStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReportStatusUpdateRequest request) {
        ReportResponse response = reportService.updateReportStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái báo cáo thành công", response));
    }
}
