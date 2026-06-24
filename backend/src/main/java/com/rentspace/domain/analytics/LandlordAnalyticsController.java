package com.rentspace.domain.analytics;

import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.analytics.dto.ConversionFunnelDto;
import com.rentspace.domain.analytics.dto.LandlordAnalyticsResponse;
import com.rentspace.domain.analytics.dto.MonthlyRevenueDto;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/landlord/analytics")
@RequiredArgsConstructor
@Tag(name = "Landlord Analytics", description = "Số liệu thống kê dành cho chủ trọ")
public class LandlordAnalyticsController {

    private final LandlordAnalyticsService landlordAnalyticsService;
    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('LANDLORD')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy thống kê lượt xem, tin nhắn và đặt cọc trong 30 ngày qua")
    public ResponseEntity<ApiResponse<LandlordAnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        LandlordAnalyticsResponse response = landlordAnalyticsService.getLandlordAnalytics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/funnel")
    @PreAuthorize("hasRole('LANDLORD')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Phễu chuyển đổi: lượt xem → nhắn tin → đặt cọc → thành công")
    public ResponseEntity<ApiResponse<ConversionFunnelDto>> getFunnel(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        User landlord = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        ConversionFunnelDto funnel = analyticsService.getLandlordFunnel(landlord.getId(), from, to);
        return ResponseEntity.ok(ApiResponse.success(funnel));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasRole('LANDLORD')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Doanh thu theo tháng trong một năm")
    public ResponseEntity<ApiResponse<List<MonthlyRevenueDto>>> getMonthlyRevenue(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "#{T(java.time.Year).now().getValue()}") int year) {
        User landlord = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        List<MonthlyRevenueDto> revenue = analyticsService.getLandlordMonthlyRevenue(landlord.getId(), year);
        return ResponseEntity.ok(ApiResponse.success(revenue));
    }
}
