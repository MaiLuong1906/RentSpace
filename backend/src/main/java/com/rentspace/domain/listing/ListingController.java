package com.rentspace.domain.listing;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.listing.dto.*;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/listings")
@RequiredArgsConstructor
@Tag(name = "Listings", description = "Quản lý tin đăng phòng trọ")
public class ListingController {

    private final ListingService listingService;

    // ===== GET /api/v1/listings =====
    @GetMapping
    @Operation(summary = "Tìm kiếm tin đăng (có filter, phân trang)")
    public ResponseEntity<ApiResponse<Page<ListingResponse>>> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minArea,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ListingResponse> result = listingService.search(city, district, minPrice, maxPrice, minArea, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ===== GET /api/v1/listings/nearby =====
    @GetMapping("/nearby")
    @Operation(summary = "Tìm phòng trong bán kính theo tọa độ")
    public ResponseEntity<ApiResponse<List<ListingResponse>>> findNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5.0") double radius,
            @RequestParam(defaultValue = "20") int limit) {
        List<ListingResponse> result = listingService.findNearby(lat, lng, radius, Math.min(limit, 50));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ===== GET /api/v1/listings/{id} =====
    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết 1 tin đăng")
    public ResponseEntity<ApiResponse<ListingResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(listingService.getById(id)));
    }

    // ===== POST /api/v1/listings =====
    @PostMapping
    @Operation(summary = "Đăng tin mới [LANDLORD]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ListingResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateListingRequest request) {
        ListingResponse response = listingService.create(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng tin thành công", response));
    }

    // ===== PUT /api/v1/listings/{id} =====
    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật tin đăng [LANDLORD, chủ sở hữu]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ListingResponse>> update(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateListingRequest request) {
        ListingResponse response = listingService.update(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tin đăng thành công", response));
    }

    // ===== PATCH /api/v1/listings/{id}/status =====
    @PatchMapping("/{id}/status")
    @Operation(summary = "Đổi trạng thái tin đăng [LANDLORD]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ListingResponse>> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateListingStatusRequest request) {
        ListingResponse response = listingService.updateStatus(id, userDetails.getUsername(), request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", response));
    }

    // ===== DELETE /api/v1/listings/{id} =====
    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tin đăng [LANDLORD hoặc ADMIN]")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        listingService.delete(id, userDetails.getUsername(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success("Xóa tin đăng thành công", null));
    }

    // ===== POST /api/v1/listings/{id}/images =====
    @PostMapping("/{id}/images")
    @Operation(summary = "Upload ảnh cho tin đăng")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<ListingImageResponse>> addImage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("image") MultipartFile image) {
        ListingImageResponse response = listingService.addImage(id, userDetails.getUsername(), image);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Upload ảnh thành công", response));
    }

    // ===== DELETE /api/v1/listings/{id}/images/{imageId} =====
    @DeleteMapping("/{id}/images/{imageId}")
    @Operation(summary = "Xóa ảnh của tin đăng")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            @AuthenticationPrincipal UserDetails userDetails) {
        listingService.deleteImage(id, imageId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Xóa ảnh thành công", null));
    }
}
