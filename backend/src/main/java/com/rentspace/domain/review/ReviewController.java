package com.rentspace.domain.review;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.review.dto.ReviewRequest;
import com.rentspace.domain.review.dto.ReviewResponse;
import com.rentspace.common.ratelimit.RateLimit;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cung cấp REST APIs quản lý các đánh giá (Reviews).
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Quản lý đánh giá phòng trọ")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/listings/{listingId}/reviews")
    @Operation(summary = "Lấy danh sách đánh giá của phòng trọ (Public)")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getListingReviews(
            @PathVariable Long listingId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReviewResponse> reviews = reviewService.getReviewsByListing(listingId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @PostMapping("/listings/{listingId}/reviews")
    @PreAuthorize("hasRole('TENANT')")
    @RateLimit(capacity = 3, durationInSeconds = 60) // Giới hạn 3 request/phút chống spam
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[TENANT] Viết đánh giá cho phòng trọ")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable Long listingId,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = reviewService.createReview(listingId, userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng đánh giá thành công", response));
    }

    @PutMapping("/reviews/{id}")
    @PreAuthorize("hasRole('TENANT')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[TENANT] Sửa đánh giá")
    public ResponseEntity<ApiResponse<ReviewResponse>> updateReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse response = reviewService.updateReview(id, userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật đánh giá thành công", response));
    }

    @DeleteMapping("/reviews/{id}")
    @PreAuthorize("hasAnyRole('TENANT', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[TENANT/ADMIN] Xóa đánh giá")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        reviewService.deleteReview(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Xóa đánh giá thành công", null));
    }
}
