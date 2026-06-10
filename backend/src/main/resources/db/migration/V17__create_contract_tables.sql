-- ============================================================
-- V17: CONTRACTS — Hợp đồng thuê cơ bản
-- ============================================================
CREATE TABLE rental_contracts (
    id              BIGSERIAL PRIMARY KEY,
    transaction_id  BIGINT NOT NULL REFERENCES deposit_transactions(id) UNIQUE,
    listing_id      BIGINT NOT NULL REFERENCES listings(id),
    tenant_id       BIGINT NOT NULL REFERENCES users(id),
    landlord_id     BIGINT NOT NULL REFERENCES users(id),
    contract_url    TEXT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    monthly_rent    BIGINT NOT NULL,
    deposit_amount  BIGINT NOT NULL,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
