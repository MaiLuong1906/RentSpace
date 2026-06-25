package com.rentspace.domain.review;

import com.rentspace.domain.review.dto.PendingReviewInfo;
import com.rentspace.domain.review.dto.RatingSummaryResponse;
import com.rentspace.domain.review.dto.SubmitReviewRequest;
import com.rentspace.domain.review.dto.TransactionReviewResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TransactionReviewService {

    /** User gửi đánh giá cho giao dịch tiền cọc đã hoàn thành */
    TransactionReviewResponse submitReview(String reviewerEmail, SubmitReviewRequest request);

    /** Lấy danh sách review đã publish của một user (reviewee = user đó) */
    Page<TransactionReviewResponse> getUserReviews(Long userId, Pageable pageable);

    /** Tóm tắt rating của một user */
    RatingSummaryResponse getUserRatingSummary(Long userId);

    /** Các deposit đã hoàn tất (RELEASED/REFUNDED) trong 30 ngày mà user chưa gửi review */
    List<PendingReviewInfo> getMyPendingReviews(String userEmail);

    /** Admin unpublish review vi phạm */
    void unpublishReview(Long reviewId, String reason);

    /** Danh sách review bị flag để admin xét duyệt */
    Page<TransactionReviewResponse> getFlaggedReviews(Pageable pageable);
}
