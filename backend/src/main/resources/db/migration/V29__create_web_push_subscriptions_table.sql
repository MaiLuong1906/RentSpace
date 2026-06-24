-- Sprint 5: Web Push Subscriptions
-- Lưu trữ PushSubscription từ browser của từng user
-- Một user có thể có nhiều subscription (Chrome desktop + Safari mobile + Edge)

CREATE TABLE web_push_subscriptions (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint     TEXT        NOT NULL UNIQUE,
    p256dh       VARCHAR(255) NOT NULL,
    auth         VARCHAR(255) NOT NULL,
    user_agent   TEXT,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ          DEFAULT NOW()
);

-- Index để query nhanh subscription active của một user
CREATE INDEX idx_web_push_user_active ON web_push_subscriptions(user_id, is_active);
