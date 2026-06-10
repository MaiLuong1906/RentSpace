package com.rentspace.domain.deposit;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.deposit.dto.DepositRequest;
import com.rentspace.domain.deposit.dto.DepositResponse;
import com.rentspace.domain.deposit.dto.PaymentResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.rentspace.common.ratelimit.RateLimit;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/deposits")
@RequiredArgsConstructor
@Tag(name = "Deposits", description = "Quản lý giao dịch đặt cọc Escrow")
public class DepositController {

    private final DepositService depositService;

    @GetMapping("/webhook/vnpay")
    @Operation(summary = "VNPay IPN Callback (Public)")
    public ResponseEntity<Map<String, String>> vnpayWebhook(HttpServletRequest request) {
        try {
            java.util.Map<String, String> params = new java.util.HashMap<>();
            for (java.util.Map.Entry<String, String[]> entry : request.getParameterMap().entrySet()) {
                if (entry.getValue() != null && entry.getValue().length > 0) {
                    params.put(entry.getKey(), entry.getValue()[0]);
                }
            }
            Map<String, String> response = depositService.processVnpayWebhook(params);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing VNPay webhook", e);
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error: " + e.getMessage()));
        }
    }

    @PostMapping
    @RateLimit(capacity = 5, durationInSeconds = 60)
    @Operation(summary = "Người thuê tạo yêu cầu đặt cọc")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<DepositResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DepositRequest request) {
        DepositResponse response = depositService.createDeposit(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Yêu cầu đặt cọc đã được tạo", response));
    }

    @PostMapping("/{id}/initiate-payment")
    @RateLimit(capacity = 5, durationInSeconds = 60)
    @Operation(summary = "Lấy URL thanh toán VNPay cho giao dịch đặt cọc")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PaymentResponse>> initiatePayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = request.getRemoteAddr();
        }
        String paymentUrl = depositService.initiatePayment(id, ipAddress, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(new PaymentResponse(paymentUrl)));
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách giao dịch đặt cọc của tôi")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<List<DepositResponse>>> getMyDeposits(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<DepositResponse> response = depositService.getMyDeposits(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết giao dịch đặt cọc")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<DepositResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        DepositResponse response = depositService.getDepositById(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
