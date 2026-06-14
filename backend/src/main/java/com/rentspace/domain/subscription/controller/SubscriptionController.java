package com.rentspace.domain.subscription.controller;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.subscription.SubscriptionService;
import com.rentspace.domain.subscription.dto.SubscriptionPlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscription Plans", description = "Các API public liên quan đến gói cước dịch vụ")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    @Operation(summary = "Lấy danh sách các gói cước đang cung cấp")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getPlans() {
        List<SubscriptionPlanResponse> plans = subscriptionService.getPricingPlans();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói cước thành công", plans));
    }
}
