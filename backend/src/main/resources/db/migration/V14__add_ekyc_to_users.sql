-- ============================================================
-- V14: KYC AUTO — Bổ sung eKYC trên bảng users
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ekyc_session_id  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ekyc_result      JSONB,
    ADD COLUMN IF NOT EXISTS ekyc_confidence  DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS ekyc_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS kyc_review_mode  VARCHAR(20) DEFAULT 'MANUAL'
                                CHECK (kyc_review_mode IN ('AUTO', 'MANUAL'));
