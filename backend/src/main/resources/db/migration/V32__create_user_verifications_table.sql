-- ============================================================
-- V32: Phase 4 Sprint 0 — eKYC Trust System
-- Tạo bảng user_verifications — source of truth cho Phase 4+
-- Coexist với ekyc_* columns trên bảng users (legacy V14)
-- ============================================================

CREATE TABLE user_verifications (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'PROCESSING', 'VERIFIED', 'REJECTED')),
    id_type          VARCHAR(20) NOT NULL DEFAULT 'CCCD'
                     CHECK (id_type IN ('CCCD', 'CMND', 'PASSPORT')),
    masked_id        VARCHAR(20),
    full_name        VARCHAR(200),
    provider         VARCHAR(50)  NOT NULL DEFAULT 'FPT_AI',
    provider_ref     VARCHAR(255),
    confidence       DECIMAL(5,2),
    rejection_reason TEXT,
    verified_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX idx_user_verifications_status  ON user_verifications(status);
