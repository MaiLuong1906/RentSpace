-- ============================================================
-- V31: ANALYTICS — Materialized view tổng hợp lượt xem theo ngày
-- Dùng cho dashboard landlord analytics (Sprint 7)
-- REFRESH CONCURRENTLY mỗi giờ — không lock bảng gốc
-- ============================================================

CREATE MATERIALIZED VIEW landlord_analytics_daily AS
SELECT
    l.landlord_id,
    lv.listing_id,
    DATE(lv.viewed_at)   AS stat_date,
    COUNT(lv.id)         AS view_count
FROM listing_views lv
JOIN listings l ON l.id = lv.listing_id
GROUP BY l.landlord_id, lv.listing_id, DATE(lv.viewed_at);

-- Bắt buộc cho REFRESH CONCURRENTLY (không lock bảng khi refresh)
CREATE UNIQUE INDEX idx_landlord_analytics_daily
    ON landlord_analytics_daily(landlord_id, listing_id, stat_date);
