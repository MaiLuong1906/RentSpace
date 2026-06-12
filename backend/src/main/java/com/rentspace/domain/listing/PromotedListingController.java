package com.rentspace.domain.listing;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.listing.dto.PromoteListingRequest;
import com.rentspace.domain.listing.dto.PromoteListingResponse;
import com.rentspace.domain.listing.dto.PromotedListingStatusResponse;
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

@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Listing Promotions", description = "Quản lý đẩy tin nổi bật (Boost Listings)")
public class PromotedListingController {

    private final PromotedListingService promotedListingService;

    @PostMapping("/{id}/promote")
    @Operation(summary = "Khởi tạo yêu cầu đẩy tin nổi bật (VNPay) [LANDLORD]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PromoteListingResponse>> promote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PromoteListingRequest request,
            HttpServletRequest servletRequest) {

        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String ipAddress = servletRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = servletRequest.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty()) {
            ipAddress = servletRequest.getRemoteAddr();
        }

        PromoteListingResponse response = promotedListingService.createPromotionPayment(
                id, userDetails.getUsername(), request, ipAddress);

        return ResponseEntity.ok(ApiResponse.success("Khởi tạo yêu cầu thanh toán đẩy tin thành công", response));
    }

    @GetMapping("/{id}/promote/status")
    @Operation(summary = "Lấy trạng thái tin nổi bật của tin đăng")
    public ResponseEntity<ApiResponse<PromotedListingStatusResponse>> getStatus(
            @PathVariable Long id) {
        PromotedListingStatusResponse response = promotedListingService.getPromotionStatus(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
