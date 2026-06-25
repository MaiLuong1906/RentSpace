package com.rentspace.domain.review;

import com.rentspace.common.response.ApiResponse;
import com.rentspace.domain.review.dto.TransactionReviewResponse;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/transaction-reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TransactionReviewAdminController {

    private final TransactionReviewService reviewService;

    @GetMapping("/flagged")
    public ResponseEntity<ApiResponse<Page<TransactionReviewResponse>>> getFlagged(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getFlaggedReviews(pageable)));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<Void>> unpublish(
            @PathVariable Long id,
            @RequestParam @NotBlank String reason) {
        reviewService.unpublishReview(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Review đã được ẩn thành công.", null));
    }
}
