package com.rentspace.domain.review;

import com.rentspace.common.exception.BusinessException;
import com.rentspace.common.exception.ResourceNotFoundException;
import com.rentspace.domain.deposit.DepositTransaction;
import com.rentspace.domain.deposit.DepositTransactionRepository;
import com.rentspace.domain.deposit.enums.DepositStatus;
import com.rentspace.domain.review.dto.PendingReviewInfo;
import com.rentspace.domain.review.dto.RatingSummaryResponse;
import com.rentspace.domain.review.dto.SubmitReviewRequest;
import com.rentspace.domain.review.dto.TransactionReviewResponse;
import com.rentspace.domain.user.User;
import com.rentspace.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TransactionReviewServiceImpl implements TransactionReviewService {

    private final UserRepository userRepository;
    private final DepositTransactionRepository depositRepository;
    private final TransactionReviewRepository reviewRepository;
    private final UserRatingSummaryRepository ratingSummaryRepository;
    private final ReviewModerationService moderationService;

    @Override
    @Transactional
    public TransactionReviewResponse submitReview(String reviewerEmail, SubmitReviewRequest request) {
        User reviewer = findUser(reviewerEmail);
        DepositTransaction deposit = depositRepository.findById(request.getDepositId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch id=" + request.getDepositId()));

        if (deposit.getStatus() != DepositStatus.RELEASED && deposit.getStatus() != DepositStatus.REFUNDED) {
            throw new BusinessException("Chỉ có thể đánh giá sau khi giao dịch hoàn tất (RELEASED hoặc REFUNDED).");
        }

        // Bug 1 fix: kiểm tra cửa sổ 30 ngày kể từ ngày hoàn tất
        LocalDateTime completedAt = deposit.getStatus() == DepositStatus.RELEASED
                ? deposit.getReleasedAt() : deposit.getRefundedAt();
        if (completedAt != null && completedAt.isBefore(LocalDateTime.now().minusDays(30))) {
            throw new BusinessException("Đã hết thời gian đánh giá (30 ngày kể từ ngày hoàn tất giao dịch).");
        }

        boolean isTenant   = deposit.getTenant().getId().equals(reviewer.getId());
        boolean isLandlord = deposit.getLandlord().getId().equals(reviewer.getId());
        if (!isTenant && !isLandlord) {
            throw new BusinessException("Bạn không thuộc giao dịch này.");
        }

        if (reviewRepository.existsByDepositIdAndReviewerId(deposit.getId(), reviewer.getId())) {
            throw new BusinessException("Bạn đã gửi đánh giá cho giao dịch này rồi.");
        }

        User reviewee       = isTenant ? deposit.getLandlord() : deposit.getTenant();
        ReviewerRole role   = isTenant ? ReviewerRole.TENANT : ReviewerRole.LANDLORD;

        boolean flagged = moderationService.containsBannedContent(request.getComment());

        TransactionReview review = TransactionReview.builder()
                .deposit(deposit)
                .reviewer(reviewer)
                .reviewee(reviewee)
                .reviewerRole(role)
                .rating(request.getRating())
                .comment(request.getComment())
                .isPublished(false)
                .isFlagged(flagged)
                .build();

        review = reviewRepository.save(review);

        tryPublishPair(deposit.getId(), reviewee.getId(), review.getRating());

        log.info("Review gửi thành công: depositId={}, reviewer={}, rating={}, flagged={}",
                deposit.getId(), reviewerEmail, request.getRating(), flagged);
        return toResponse(review);
    }

    @Override
    public Page<TransactionReviewResponse> getUserReviews(Long userId, Pageable pageable) {
        return reviewRepository
                .findAllByRevieweeIdAndIsPublishedTrue(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    public RatingSummaryResponse getUserRatingSummary(Long userId) {
        return ratingSummaryRepository.findByUserId(userId)
                .map(s -> RatingSummaryResponse.builder()
                        .userId(userId)
                        .totalReviews(s.getTotalReviews())
                        .averageRating(s.getAverageRating())
                        .rating1Count(s.getRating1Count())
                        .rating2Count(s.getRating2Count())
                        .rating3Count(s.getRating3Count())
                        .rating4Count(s.getRating4Count())
                        .rating5Count(s.getRating5Count())
                        .build())
                .orElse(RatingSummaryResponse.builder()
                        .userId(userId)
                        .totalReviews(0)
                        .averageRating(BigDecimal.ZERO)
                        .rating1Count(0).rating2Count(0).rating3Count(0)
                        .rating4Count(0).rating5Count(0)
                        .build());
    }

    @Override
    public List<PendingReviewInfo> getMyPendingReviews(String userEmail) {
        User user = findUser(userEmail);
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

        List<DepositTransaction> candidates =
                depositRepository.findCompletedDepositsForUser(user.getId(), cutoff);

        Set<Long> alreadyReviewed =
                reviewRepository.findDepositIdsReviewedByUser(user.getId());

        return candidates.stream()
                .filter(d -> !alreadyReviewed.contains(d.getId()))
                .map(d -> {
                    boolean isTenant = d.getTenant().getId().equals(user.getId());
                    User reviewee = isTenant ? d.getLandlord() : d.getTenant();
                    LocalDateTime completedAt = d.getStatus() == DepositStatus.RELEASED
                            ? d.getReleasedAt() : d.getRefundedAt();
                    return new PendingReviewInfo(
                            d.getId(),
                            reviewee.getId(),
                            reviewee.getFullName(),
                            reviewee.getAvatarUrl(),
                            d.getStatus().name(),
                            completedAt
                    );
                })
                .toList();
    }

    @Override
    @Transactional
    public void unpublishReview(Long reviewId, String reason) {
        TransactionReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy review id=" + reviewId));

        review.setIsPublished(false);
        review.setIsFlagged(true);
        review.setFlagReason(reason);
        reviewRepository.save(review);
        log.info("Admin unpublish review id={}, reason={}", reviewId, reason);
    }

    @Override
    public Page<TransactionReviewResponse> getFlaggedReviews(Pageable pageable) {
        return reviewRepository.findAllByIsFlaggedTrue(pageable).map(this::toResponse);
    }

    // ===== Helpers =====

    /** Publish cả 2 review khi đối phương đã gửi, hoặc chỉ update summary nếu 1 chiều */
    @Transactional
    protected void tryPublishPair(Long depositId, Long revieweeId, short newRating) {
        List<TransactionReview> all = reviewRepository.findAllByDepositId(depositId);
        boolean bothSubmitted = all.size() >= 2;

        if (bothSubmitted) {
            all.forEach(r -> {
                if (!r.getIsPublished() && !r.getIsFlagged()) {
                    r.setIsPublished(true);
                    r.setPublishedAt(Instant.now());
                    reviewRepository.save(r);
                    updateRatingSummary(r.getReviewee().getId(), r.getRating());
                }
            });
        }
    }

    @Transactional
    protected void updateRatingSummary(Long userId, short rating) {
        UserRatingSummary summary = ratingSummaryRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User u = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                    return UserRatingSummary.builder().user(u).build();
                });
        summary.incrementRating(rating);
        ratingSummaryRepository.save(summary);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng: " + email));
    }

    private TransactionReviewResponse toResponse(TransactionReview r) {
        return TransactionReviewResponse.builder()
                .id(r.getId())
                .depositId(r.getDeposit().getId())
                .reviewerId(r.getReviewer().getId())
                .reviewerName(r.getReviewer().getFullName())
                .reviewerAvatarUrl(r.getReviewer().getAvatarUrl())
                .reviewerRole(r.getReviewerRole().name())
                .rating(r.getRating())
                .comment(r.getComment())
                .isPublished(r.getIsPublished())
                .publishedAt(r.getPublishedAt())
                .isFlagged(r.getIsFlagged())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
