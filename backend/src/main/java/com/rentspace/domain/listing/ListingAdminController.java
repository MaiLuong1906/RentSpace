package com.rentspace.domain.listing;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.listing.dto.ListingResponse;
import com.rentspace.domain.listing.enums.ListingStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Admin Listings", description = "API quản trị phê duyệt tin đăng phòng trọ")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class ListingAdminController {

    private final ListingService listingService;

    // ===== GET /api/v1/admin/listings =====
    @GetMapping
    @Operation(summary = "[ADMIN] Lấy danh sách tin đăng toàn hệ thống (lọc theo status, phân trang)")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> getAllListings(
            @RequestParam(required = false) ListingStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ListingResponse> result = listingService.getAllListingsForAdmin(status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tin đăng thành công", result));
    }

    // ===== PATCH /api/v1/admin/listings/{id}/approve =====
    @PatchMapping("/{id}/approve")
    @Operation(summary = "[ADMIN] Duyệt đăng tin phòng trọ")
    public ResponseEntity<ApiResponse<ListingResponse>> approveListing(@PathVariable Long id) {
        ListingResponse response = listingService.approveListing(id);
        return ResponseEntity.ok(ApiResponse.success("Duyệt tin đăng thành công", response));
    }

    // ===== PATCH /api/v1/admin/listings/{id}/reject =====
    @PatchMapping("/{id}/reject")
    @Operation(summary = "[ADMIN] Từ chối duyệt tin đăng phòng trọ")
    public ResponseEntity<ApiResponse<ListingResponse>> rejectListing(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Nội dung tin đăng không phù hợp hoặc thiếu thông tin") String reason) {
        ListingResponse response = listingService.rejectListing(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối duyệt tin đăng", response));
    }
}
