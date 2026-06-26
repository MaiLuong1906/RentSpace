-- Phase 4 Sprint 6: Contract AI Assistant — bảng theo dõi lượng token & quota
CREATE TABLE ai_usage_log (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       REFERENCES users(id),
    contract_id   BIGINT       REFERENCES contracts(id),
    feature       VARCHAR(50)  NOT NULL,    -- 'CONTRACT_ASSISTANT'
    model_used    VARCHAR(100) NOT NULL,
    input_tokens  INTEGER      NOT NULL,
    output_tokens INTEGER      NOT NULL,
    latency_ms    INTEGER,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_log_user_contract ON ai_usage_log(user_id, contract_id, created_at DESC);
CREATE INDEX idx_ai_log_feature       ON ai_usage_log(feature, created_at DESC);
