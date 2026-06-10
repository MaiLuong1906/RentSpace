-- ============================================================
-- V19: LISTING VIEWS — Tracking lượt xem
-- ============================================================
CREATE TABLE listing_views (
    id          BIGSERIAL PRIMARY KEY,
    listing_id  BIGINT NOT NULL REFERENCES listings(id),
    viewer_id   BIGINT REFERENCES users(id),    -- NULL = anonymous
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_views_listing_date ON listing_views(listing_id, viewed_at DESC);
