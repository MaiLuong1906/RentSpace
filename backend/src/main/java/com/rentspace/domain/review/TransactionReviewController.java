package com.rentspace.domain.review;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.review.dto.PendingReviewInfo;
import com.rentspace.domain.review.dto.RatingSummaryResponse;
import com.rentspace.domain.review.dto.SubmitReviewRequest;
import com.rentspace.domain.review.dto.TransactionReviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transaction-reviews")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER', 'TENANT', 'LANDLORD', 'ADMIN')")
public class TransactionReviewController {

    private final TransactionReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionReviewResponse>> submit(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SubmitReviewRequest request) {
        TransactionReviewResponse result = reviewService.submitReview(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Page<TransactionReviewResponse>>> getUserReviews(
            @PathVariable Long userId,
            @PageableDefault(size = 10, sort = "publishedAt") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getUserReviews(userId, pageable)));
    }

    @GetMapping("/users/{userId}/rating-summary")
    public ResponseEntity<ApiResponse<RatingSummaryResponse>> getRatingSummary(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getUserRatingSummary(userId)));
    }

    @GetMapping("/my-pending")
    public ResponseEntity<ApiResponse<List<PendingReviewInfo>>> getMyPending(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getMyPendingReviews(userDetails.getUsername())));
    }
}
