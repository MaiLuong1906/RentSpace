-- ============================================================
-- V26: SELLER PRO — Đăng ký gói dịch vụ hội viên chủ trọ
-- ============================================================

CREATE TABLE subscription_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,      -- 'FREE', 'SELLER_PRO_MONTHLY', 'SELLER_PRO_YEARLY'
    display_name    VARCHAR(100) NOT NULL,
    price           BIGINT NOT NULL DEFAULT 0,
    duration_days   INTEGER NOT NULL,                 -- 0 đối với gói FREE (vĩnh viễn)
    max_listings    INTEGER NOT NULL DEFAULT 10,
    max_images      INTEGER NOT NULL DEFAULT 5,
    boost_credits   INTEGER NOT NULL DEFAULT 0,
    analytics_level VARCHAR(20) NOT NULL DEFAULT 'BASIC'
                    CHECK (analytics_level IN ('BASIC', 'ADVANCED'))
);

INSERT INTO subscription_plans (id, name, display_name, price, duration_days, max_listings, max_images, boost_credits, analytics_level)
VALUES
    (1, 'FREE', 'Miễn phí', 0, 0, 10, 5, 0, 'BASIC'),
    (2, 'SELLER_PRO_MONTHLY', 'Seller Pro (Tháng)', 99000, 30, 50, 15, 2, 'ADVANCED'),
    (3, 'SELLER_PRO_YEARLY', 'Seller Pro (Năm)', 799000, 365, 50, 15, 25, 'ADVANCED')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE user_subscriptions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    plan_id         INTEGER NOT NULL REFERENCES subscription_plans(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,                      -- NULL đối với gói FREE
    payment_ref     VARCHAR(255),                     -- Mã giao dịch thanh toán (MoMo/VNPay)
    auto_renew      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_user ON user_subscriptions(user_id, status);
CREATE INDEX idx_sub_expires ON user_subscriptions(expires_at) WHERE status = 'ACTIVE';
