package com.rentspace.domain.payout;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.payout.dto.PayoutAccountRequest;
import com.rentspace.domain.payout.dto.PayoutAccountResponse;
import com.rentspace.domain.payout.dto.PayoutResponse;
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
@RequestMapping("/api/v1/landlord")
@RequiredArgsConstructor
@Tag(name = "Landlord Payout", description = "Quản lý tài khoản ngân hàng và lịch sử rút tiền của chủ nhà")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('LANDLORD')")
public class LandlordPayoutController {

    private final PayoutService payoutService;

    @PutMapping("/payout-account")
    @Operation(summary = "Liên kết hoặc cập nhật tài khoản ngân hàng nhận tiền")
    public ResponseEntity<ApiResponse<PayoutAccountResponse>> linkAccount(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PayoutAccountRequest request) {
        PayoutAccountResponse response = payoutService.linkPayoutAccount(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Liên kết tài khoản ngân hàng thành công", response));
    }

    @GetMapping("/payout-account")
    @Operation(summary = "Xem thông tin tài khoản ngân hàng hiện tại")
    public ResponseEntity<ApiResponse<PayoutAccountResponse>> getAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        PayoutAccountResponse response = payoutService.getPayoutAccount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản ngân hàng thành công", response));
    }

    @GetMapping("/payouts")
    @Operation(summary = "Xem lịch sử giải ngân của chủ nhà")
    public ResponseEntity<ApiResponse<Page<PayoutResponse>>> getPayouts(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PayoutResponse> response = payoutService.getPayoutHistory(userDetails.getUsername(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu giải ngân thành công", response));
    }
}
