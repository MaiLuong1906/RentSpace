-- ============================================================
-- V12: DEPOSIT — Giao dịch đặt cọc Escrow
-- ============================================================
CREATE TABLE IF NOT EXISTS deposit_transactions (
    id                  BIGSERIAL PRIMARY KEY,
    listing_id          BIGINT NOT NULL REFERENCES listings(id),
    tenant_id           BIGINT NOT NULL REFERENCES users(id),
    landlord_id         BIGINT NOT NULL REFERENCES users(id),
    amount              BIGINT NOT NULL,                          -- VND nguyên
    platform_fee        BIGINT NOT NULL,
    net_amount          BIGINT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT'
                        CHECK (status IN (
                            'PENDING_PAYMENT',
                            'PAID',
                            'DISPUTED',
                            'RELEASED',
                            'REFUNDED',
                            'CANCELLED'
                        )),
    payment_method      VARCHAR(20),                              -- 'VNPAY'
    payment_gateway_ref VARCHAR(255),
    payment_url         TEXT,
    paid_at             TIMESTAMPTZ,
    released_at         TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    release_deadline    TIMESTAMPTZ,
    move_in_date        DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposit_transaction_events (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES deposit_transactions(id),
    event_type      VARCHAR(50) NOT NULL,
    actor_id        BIGINT REFERENCES users(id),
    description     TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_tx_tenant ON deposit_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_landlord ON deposit_transactions(landlord_id);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_status ON deposit_transactions(status);
CREATE INDEX IF NOT EXISTS idx_deposit_tx_listing ON deposit_transactions(listing_id);
