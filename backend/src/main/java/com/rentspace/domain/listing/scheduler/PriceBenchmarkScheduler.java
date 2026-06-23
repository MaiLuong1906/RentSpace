package com.rentspace.domain.listing.scheduler;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class PriceBenchmarkScheduler {

    private final EntityManager entityManager;

    /**
     * Chạy tự động lúc 2:00 AM hàng ngày để tính toán lại phân vị giá thuê.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void calculatePriceBenchmarks() {
        log.info("Bắt đầu tính toán lại các mốc phân vị giá thuê (Price Benchmarks)...");

        // Không dùng try-catch để exception propagate ra ngoài — Spring AOP sẽ rollback
        // cả DELETE lẫn INSERT nếu có lỗi xảy ra, tránh để bảng trống
        entityManager.createNativeQuery("DELETE FROM price_benchmarks").executeUpdate();

        String insertSql = """
            INSERT INTO price_benchmarks (city, district, room_type, area_bucket, sample_count, p25_price, p50_price, p75_price, data_source, computed_at)
            WITH listing_buckets AS (
                SELECT
                    city,
                    COALESCE(district, '') as district,
                    room_type,
                    CASE
                        WHEN area_m2 < 20 THEN '0-20'
                        WHEN area_m2 >= 20 AND area_m2 < 30 THEN '20-30'
                        WHEN area_m2 >= 30 AND area_m2 < 50 THEN '30-50'
                        ELSE '50+'
                    END as area_bucket,
                    price_per_month
                FROM listings
                WHERE status = 'ACTIVE'
                  AND city IS NOT NULL
                  AND price_per_month IS NOT NULL
                  AND area_m2 IS NOT NULL
            )
            SELECT
                city,
                district,
                room_type,
                area_bucket,
                COUNT(*) as sample_count,
                ROUND(percentile_cont(0.25) WITHIN GROUP (ORDER BY price_per_month))::bigint as p25,
                ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY price_per_month))::bigint as p50,
                ROUND(percentile_cont(0.75) WITHIN GROUP (ORDER BY price_per_month))::bigint as p75,
                'LISTING' as data_source,
                NOW() as computed_at
            FROM listing_buckets
            GROUP BY city, district, room_type, area_bucket
            HAVING COUNT(*) >= 1
            """;

        int rowsInserted = entityManager.createNativeQuery(insertSql).executeUpdate();
        log.info("Đã tính toán và chèn thành công {} bản ghi phân vị giá thuê mới.", rowsInserted);
    }
}
