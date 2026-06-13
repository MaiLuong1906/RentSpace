package com.rentspace.domain.payout;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.payout.dto.PayoutResponse;
import com.rentspace.domain.payout.dto.ProcessPayoutRequest;
import com.rentspace.domain.payout.enums.PayoutStatus;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/payouts")
@RequiredArgsConstructor
@Tag(name = "Admin Payout", description = "API quản trị và xử lý giải ngân tiền cho chủ nhà")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPayoutController {

    private final PayoutService payoutService;

    @GetMapping
    @Operation(summary = "[ADMIN] Xem danh sách các yêu cầu giải ngân theo trạng thái")
    public ResponseEntity<ApiResponse<Page<PayoutResponse>>> getPayouts(
            @RequestParam(defaultValue = "PENDING") PayoutStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PayoutResponse> response = payoutService.getPendingPayoutsForAdmin(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu giải ngân thành công", response));
    }

    @PostMapping("/{id}/process")
    @Operation(summary = "[ADMIN] Xác nhận hoặc từ chối yêu cầu giải ngân")
    public ResponseEntity<ApiResponse<PayoutResponse>> processPayout(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProcessPayoutRequest request) {
        PayoutResponse response = payoutService.processPayout(
                id,
                userDetails.getUsername(),
                request.getStatus(),
                request.getBankRef(),
                request.getNote()
        );
        return ResponseEntity.ok(ApiResponse.success("Xử lý yêu cầu giải ngân thành công", response));
    }
}
