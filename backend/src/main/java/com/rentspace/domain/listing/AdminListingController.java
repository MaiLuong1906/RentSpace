package com.rentspace.domain.listing;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.listing.dto.ListingResponse;
import com.rentspace.domain.listing.dto.UpdateListingStatusRequest;
import com.rentspace.domain.listing.enums.ListingStatus;
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
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/listings")
@RequiredArgsConstructor
@Tag(name = "Admin - Listings", description = "Quản lý tin đăng dành cho Admin")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminListingController {

    private final AdminListingService adminListingService;

    // ===== GET /api/v1/admin/listings =====
    @GetMapping
    @Operation(summary = "[ADMIN] Lấy tất cả tin đăng (mọi status), có filter và phân trang")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> getAllListings(
            @RequestParam(required = false) ListingStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ListingResponse> result = adminListingService.getAllListings(status, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ===== PATCH /api/v1/admin/listings/{id}/status =====
    @PatchMapping("/{id}/status")
    @Operation(summary = "[ADMIN] Cập nhật trạng thái tin đăng (ẩn, kích hoạt, xóa...)")
    public ResponseEntity<ApiResponse<ListingResponse>> updateListingStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateListingStatusRequest request) {
        ListingResponse response = adminListingService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tin đăng thành công", response));
    }
}
