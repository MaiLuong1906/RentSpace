package com.rentspace.domain.review;

import com.rentspace.domain.review.dto.ReviewRequest;
import com.rentspace.domain.review.dto.ReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Interface định nghĩa các nghiệp vụ của Review.
 */
public interface ReviewService {

    /**
     * Lấy danh sách đánh giá của phòng trọ (phân trang).
     */
    Page<ReviewResponse> getReviewsByListing(Long listingId, Pageable pageable);

    /**
     * Viết đánh giá cho phòng trọ.
     */
    ReviewResponse createReview(Long listingId, String tenantEmail, ReviewRequest request);

    /**
     * Sửa đánh giá.
     */
    ReviewResponse updateReview(Long reviewId, String tenantEmail, ReviewRequest request);

    /**
     * Xóa đánh giá.
     */
    void deleteReview(Long reviewId, String userEmail);
}
