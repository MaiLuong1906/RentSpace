package com.rentspace.domain.analytics;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class MaterializedViewRefreshScheduler {

    private final EntityManager entityManager;

    // Refresh mỗi giờ, không lock bảng nhờ CONCURRENTLY
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void refreshAnalytics() {
        log.info("Bắt đầu refresh materialized view landlord_analytics_daily...");
        entityManager.createNativeQuery(
                "REFRESH MATERIALIZED VIEW CONCURRENTLY landlord_analytics_daily"
        ).executeUpdate();
        log.info("Refresh materialized view landlord_analytics_daily hoàn thành.");
    }
}
