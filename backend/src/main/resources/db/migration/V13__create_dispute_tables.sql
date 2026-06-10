-- ============================================================
-- V13: DISPUTES — Tranh chấp giao dịch đặt cọc
-- ============================================================
CREATE TABLE IF NOT EXISTS deposit_disputes (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES deposit_transactions(id) UNIQUE,
    opened_by       BIGINT NOT NULL REFERENCES users(id),
    reason          VARCHAR(50) NOT NULL
                    CHECK (reason IN (
                        'ROOM_NOT_AS_DESCRIBED',
                        'LANDLORD_NO_SHOW',
                        'TENANT_NO_SHOW',
                        'DEPOSIT_DISPUTE',
                        'OTHER'
                    )),
    description     TEXT NOT NULL,
    evidence_urls   TEXT[],
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                    CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED_TENANT', 'RESOLVED_LANDLORD', 'CLOSED')),
    resolution_note TEXT,
    resolved_by     BIGINT REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
