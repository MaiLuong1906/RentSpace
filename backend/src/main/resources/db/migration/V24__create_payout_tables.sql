-- ============================================================
-- V24: PAYOUTS — Quản lý giải ngân cho Chủ trọ
-- ============================================================

CREATE TABLE IF NOT EXISTS landlord_payout_accounts (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    bank_name       VARCHAR(100) NOT NULL,
    bank_code       VARCHAR(20) NOT NULL,           -- Napas bank code (e.g. VCB, TCB)
    account_number  VARCHAR(255) NOT NULL,          -- AES-256 encrypted
    account_name    VARCHAR(200) NOT NULL,          -- Tên viết hoa không dấu
    is_verified     BOOLEAN DEFAULT FALSE,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
    id              BIGSERIAL PRIMARY KEY,
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    payout_account_id BIGINT NOT NULL REFERENCES landlord_payout_accounts(id),
    deposit_id      BIGINT NOT NULL REFERENCES deposit_transactions(id) UNIQUE,
    amount          BIGINT NOT NULL,
    fee             BIGINT NOT NULL DEFAULT 0,
    net_amount      BIGINT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    bank_ref        VARCHAR(255),
    processed_at    TIMESTAMPTZ,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_landlord ON payouts(landlord_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
