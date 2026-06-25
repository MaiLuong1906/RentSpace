package com.rentspace.domain.review;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Tự động publish review sau 30 ngày kể từ ngày tạo,
 * kể cả khi đối phương chưa gửi review (blind review timeout).
 * Chạy lúc 00:30 hàng ngày.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewPublishScheduler {

    private static final int AUTO_PUBLISH_DAYS = 30;

    private final TransactionReviewRepository reviewRepository;
    private final TransactionReviewServiceImpl reviewService;

    @Scheduled(cron = "0 30 0 * * *")
    @Transactional
    public void autoPublishExpiredReviews() {
        Instant cutoff = Instant.now().minus(AUTO_PUBLISH_DAYS, ChronoUnit.DAYS);
        List<TransactionReview> stale = reviewRepository.findUnpublishedOlderThan(cutoff);

        if (stale.isEmpty()) {
            log.debug("ReviewPublishScheduler: không có review nào cần auto-publish.");
            return;
        }

        int published = 0;
        for (TransactionReview review : stale) {
            if (review.getIsFlagged()) continue;
            review.setIsPublished(true);
            review.setPublishedAt(Instant.now());
            reviewRepository.save(review);
            reviewService.updateRatingSummary(review.getReviewee().getId(), review.getRating());
            published++;
        }

        log.info("ReviewPublishScheduler: auto-published {} review(s) sau {} ngày chờ.",
                published, AUTO_PUBLISH_DAYS);
    }
}
