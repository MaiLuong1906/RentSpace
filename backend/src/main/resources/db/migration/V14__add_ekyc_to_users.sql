-- ============================================================
-- V14: KYC AUTO — Bổ sung eKYC trên bảng users
-- ============================================================
ALTER TABLE users
    ADD COLUMN ekyc_session_id  VARCHAR(255),
    ADD COLUMN ekyc_result      JSONB,
    ADD COLUMN ekyc_confidence  DECIMAL(5,2),
    ADD COLUMN ekyc_verified_at TIMESTAMPTZ,
    ADD COLUMN kyc_review_mode  VARCHAR(20) DEFAULT 'MANUAL'
                                CHECK (kyc_review_mode IN ('AUTO', 'MANUAL'));
