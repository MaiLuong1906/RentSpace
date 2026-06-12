-- ============================================================
-- V22: PERFORMANCE INDEXES — Tối ưu query dedup view tracking
-- ============================================================

-- Index hỗ trợ query dedup lượt xem trong 24h cho user đã đăng nhập:
-- existsByListingIdAndViewerIdAndViewedAtAfter(listingId, viewerId, after)
-- V19 đã có idx_listing_views_listing_date(listing_id, viewed_at) cho analytics tổng hợp.
-- Index này bổ sung viewer_id để tối ưu dedup query riêng biệt.
CREATE INDEX IF NOT EXISTS idx_listing_views_viewer_listing_date
    ON listing_views(viewer_id, listing_id, viewed_at DESC)
    WHERE viewer_id IS NOT NULL; -- Partial index, chỉ áp dụng cho user đã đăng nhập
