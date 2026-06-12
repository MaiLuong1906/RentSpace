package com.rentspace.domain.analytics;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.analytics.dto.LandlordAnalyticsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/landlord/analytics")
@RequiredArgsConstructor
@Tag(name = "Landlord Analytics", description = "Số liệu thống kê dành cho chủ trọ")
public class LandlordAnalyticsController {

    private final LandlordAnalyticsService landlordAnalyticsService;

    @GetMapping
    @PreAuthorize("hasRole('LANDLORD')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Lấy thống kê lượt xem, tin nhắn và đặt cọc trong 30 ngày qua")
    public ResponseEntity<ApiResponse<LandlordAnalyticsResponse>> getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        LandlordAnalyticsResponse response = landlordAnalyticsService.getLandlordAnalytics(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
