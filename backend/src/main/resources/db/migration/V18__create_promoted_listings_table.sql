-- ============================================================
-- V18: PROMOTED LISTINGS — Tin đăng nổi bật (boost)
-- ============================================================
CREATE TABLE promoted_listings (
    id              BIGSERIAL PRIMARY KEY,
    listing_id      BIGINT NOT NULL REFERENCES listings(id),
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    amount_paid     BIGINT NOT NULL,
    payment_ref     VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_promoted_active ON promoted_listings(is_active, expires_at);
