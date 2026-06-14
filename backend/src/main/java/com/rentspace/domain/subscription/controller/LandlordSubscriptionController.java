package com.rentspace.domain.subscription.controller;

import com.rentspace.common.ratelimit.RateLimit;
import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.deposit.dto.PaymentResponse;
import com.rentspace.domain.subscription.SubscriptionService;
import com.rentspace.domain.subscription.dto.SubscribeRequest;
import com.rentspace.domain.subscription.dto.UserSubscriptionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/landlord/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Landlord Subscriptions", description = "Các API dành cho chủ nhà quản lý gói cước hội viên")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('LANDLORD')")
public class LandlordSubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/current")
    @Operation(summary = "Xem gói cước hiện tại của chủ nhà")
    public ResponseEntity<ApiResponse<UserSubscriptionResponse>> getCurrentSubscription(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserSubscriptionResponse response = subscriptionService.getCurrentSubscription(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin gói cước thành công", response));
    }

    @PostMapping("/subscribe")
    @RateLimit(capacity = 3, durationInSeconds = 60)
    @Operation(summary = "Đăng ký hoặc nâng cấp gói cước hội viên")
    public ResponseEntity<ApiResponse<PaymentResponse>> subscribe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "method", defaultValue = "VNPAY") String method,
            @Valid @RequestBody SubscribeRequest request,
            HttpServletRequest servletRequest) {
        
        String ipAddress = servletRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = servletRequest.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = servletRequest.getRemoteAddr();
        }

        String result = subscriptionService.createUpgradePayment(userDetails.getUsername(), request, method, ipAddress);
        
        if ("FREE_ACTIVATED".equals(result)) {
            return ResponseEntity.ok(ApiResponse.success("Đã kích hoạt gói cước Miễn phí thành công", new PaymentResponse("FREE")));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Khởi tạo thanh toán nâng cấp gói cước thành công", new PaymentResponse(result)));
    }
}
