package com.rentspace.domain.deposit;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.deposit.dto.DepositResponse;
import com.rentspace.domain.deposit.dto.DisputeResponse;
import com.rentspace.domain.deposit.dto.ResolveDisputeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/disputes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Disputes", description = "Quản lý tranh chấp đặt cọc (Admin)")
@SecurityRequirement(name = "bearerAuth")
public class AdminDisputeController {

    private final DepositService depositService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả tranh chấp đặt cọc")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getAllDisputes() {
        List<DisputeResponse> response = depositService.getAllDisputes();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/resolve")
    @Operation(summary = "Admin phán quyết / giải quyết tranh chấp đặt cọc")
    public ResponseEntity<ApiResponse<DepositResponse>> resolveDispute(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ResolveDisputeRequest request) {
        DepositResponse response = depositService.resolveDispute(
                id,
                request.getResolution(),
                request.getResolutionNote(),
                userDetails.getUsername()
        );
        return ResponseEntity.ok(ApiResponse.success("Giải quyết tranh chấp đặt cọc thành công", response));
    }
}
