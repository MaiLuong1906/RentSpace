package com.rentspace.domain.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface TransactionReviewRepository extends JpaRepository<TransactionReview, Long> {

    Optional<TransactionReview> findByDepositIdAndReviewerId(Long depositId, Long reviewerId);

    boolean existsByDepositIdAndReviewerId(Long depositId, Long reviewerId);

    List<TransactionReview> findAllByDepositId(Long depositId);

    /** Lấy review đã publish của một user (là reviewee) */
    Page<TransactionReview> findAllByRevieweeIdAndIsPublishedTrue(Long revieweeId, Pageable pageable);

    /** Các review chưa publish mà reviewer là user (pending gửi review) */
    List<TransactionReview> findAllByReviewerIdAndIsPublishedFalse(Long reviewerId);

    /** Review bị flag để admin kiểm duyệt */
    Page<TransactionReview> findAllByIsFlaggedTrue(Pageable pageable);

    /** Các review CHƯA publish đã qua ngày kết thúc chờ (auto-publish sau 30 ngày) */
    @Query("""
        SELECT r FROM TransactionReview r
        WHERE r.isPublished = false
          AND r.createdAt < :cutoffDate
        """)
    List<TransactionReview> findUnpublishedOlderThan(@Param("cutoffDate") Instant cutoffDate);

    /** Tập hợp depositId mà user đã gửi review — dùng để lọc pending */
    @Query("SELECT r.deposit.id FROM TransactionReview r WHERE r.reviewer.id = :userId")
    Set<Long> findDepositIdsReviewedByUser(@Param("userId") Long userId);
}
