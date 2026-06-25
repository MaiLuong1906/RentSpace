-- Phase 4 Sprint 2-3: Hợp đồng thuê phòng kỹ thuật số với state machine
-- Khác với rental_contracts (V17) — đây có state machine đầy đủ và immutability sau khi ký.

CREATE TABLE contracts (
    id                  BIGSERIAL PRIMARY KEY,
    deposit_id          BIGINT          NOT NULL REFERENCES deposit_transactions(id) ON DELETE CASCADE,
    landlord_id         BIGINT          NOT NULL REFERENCES users(id),
    tenant_id           BIGINT          NOT NULL REFERENCES users(id),

    -- Nội dung hợp đồng (lưu dạng JSON để render PDF)
    content_snapshot    TEXT            NOT NULL,

    -- State machine: DRAFT → PENDING_SIGNATURES → FULLY_SIGNED / CANCELLED / EXPIRED
    status              VARCHAR(30)     NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT','PENDING_SIGNATURES','FULLY_SIGNED','CANCELLED','EXPIRED')),

    -- Chữ ký điện tử (timestamp khi ký)
    landlord_signed_at  TIMESTAMPTZ,
    tenant_signed_at    TIMESTAMPTZ,

    -- Hợp đồng tự expire nếu chưa ký sau N ngày
    expires_at          TIMESTAMPTZ,

    -- PDF URL sau khi generate
    pdf_url             TEXT,

    -- Lý do hủy
    cancellation_reason TEXT,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_contract_deposit UNIQUE (deposit_id)
);

CREATE INDEX idx_contracts_landlord ON contracts(landlord_id, status);
CREATE INDEX idx_contracts_tenant   ON contracts(tenant_id, status);
CREATE INDEX idx_contracts_status   ON contracts(status, expires_at);
