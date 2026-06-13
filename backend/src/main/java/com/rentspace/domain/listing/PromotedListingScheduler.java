package com.rentspace.domain.listing;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PromotedListingScheduler {

    private final PromotedListingRepository promotedListingRepository;

    /**
     * Chạy định kỳ mỗi 10 phút một lần để kiểm tra và vô hiệu hóa các gói đẩy tin đã quá hạn.
     */
    @Scheduled(cron = "0 */10 * * * *")
    @Transactional
    public void deactivateExpiredPromotions() {
        log.info("Starting scheduled job: Deactivating expired promotions at {}", LocalDateTime.now());
        
        List<PromotedListing> expiredPromotions = promotedListingRepository.findAllExpired(LocalDateTime.now());
        if (expiredPromotions.isEmpty()) {
            log.info("No expired listing promotions found.");
            return;
        }

        for (PromotedListing promo : expiredPromotions) {
            promo.setIsActive(false);
        }
        
        promotedListingRepository.saveAll(expiredPromotions);
        log.info("Successfully deactivated {} expired listing promotions.", expiredPromotions.size());
    }

    /**
     * Chạy định kỳ mỗi 24 giờ lúc 2:00 sáng để dọn dẹp các yêu cầu đẩy tin chưa thanh toán (isActive = false) 
     * được tạo quá 24 giờ trước.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupUnpaidPromotions() {
        log.info("Starting scheduled job: Cleaning up unpaid promotions...");
        LocalDateTime threshold = LocalDateTime.now().minusDays(1);
        List<PromotedListing> unpaidPromotions = promotedListingRepository.findUnpaidOlderThan(threshold);
        if (unpaidPromotions.isEmpty()) {
            log.info("No unpaid promotions found for cleanup.");
            return;
        }
        promotedListingRepository.deleteAll(unpaidPromotions);
        log.info("Successfully cleaned up {} unpaid promotions.", unpaidPromotions.size());
    }
}
