package com.rentspace.domain.analytics;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.analytics.dto.AdminFinancialSummaryDto;
import com.rentspace.domain.analytics.dto.TopLandlordDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@Tag(name = "Admin Analytics", description = "Dashboard tài chính tổng quan dành cho Admin")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Tổng quan tài chính: tổng doanh thu, số giao dịch, số landlord hoạt động")
    public ResponseEntity<ApiResponse<AdminFinancialSummaryDto>> getSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        AdminFinancialSummaryDto summary = analyticsService.getAdminSummary(from, to);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/top-landlords")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Top landlords theo doanh thu trong khoảng thời gian")
    public ResponseEntity<ApiResponse<List<TopLandlordDto>>> getTopLandlords(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit) {
        List<TopLandlordDto> topLandlords = analyticsService.getTopLandlords(from, to, limit);
        return ResponseEntity.ok(ApiResponse.success(topLandlords));
    }
}
