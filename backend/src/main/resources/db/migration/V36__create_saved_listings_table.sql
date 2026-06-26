-- ============================================================
-- V36: SAVED LISTINGS — Wishlist / Tin yêu thích
-- ============================================================

CREATE TABLE saved_listings (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id  BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

-- Index để lấy danh sách saved của 1 user theo thứ tự mới nhất
CREATE INDEX idx_saved_user
    ON saved_listings(user_id, created_at DESC);
