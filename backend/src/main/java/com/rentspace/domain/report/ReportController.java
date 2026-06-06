package com.rentspace.domain.report;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.report.dto.ReportRequest;
import com.rentspace.domain.report.dto.ReportResponse;
import com.rentspace.common.ratelimit.RateLimit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận báo cáo vi phạm phòng trọ từ phía người dùng.
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "API Báo cáo vi phạm")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @RateLimit(capacity = 2, durationInSeconds = 60) // Giới hạn 2 request/phút tránh spam
    @Operation(summary = "Gửi báo cáo vi phạm phòng trọ")
    public ResponseEntity<ApiResponse<ReportResponse>> submitReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReportRequest request) {
        ReportResponse response = reportService.submitReport(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi báo cáo vi phạm thành công", response));
    }
}
