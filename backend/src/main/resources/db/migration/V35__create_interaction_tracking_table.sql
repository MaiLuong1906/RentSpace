-- ============================================================
-- V35: USER LISTING INTERACTIONS — Tracking hành vi người dùng
-- Dữ liệu đầu vào cho Recommendation Engine (Sprint 5 Phase 4)
-- ============================================================

CREATE TABLE user_listing_interactions (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id          VARCHAR(100),
    listing_id          BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    interaction_type    VARCHAR(20) NOT NULL
                        CHECK (interaction_type IN ('VIEW','SAVE','UNSAVE','CHAT_INIT','DEPOSIT','SHARE')),
    view_duration_sec   INTEGER,
    referrer            VARCHAR(50),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index tra cứu theo user (chỉ cho logged-in users)
CREATE INDEX idx_interactions_user
    ON user_listing_interactions(user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

-- Index tra cứu theo listing + type (cho analytics và co-view query)
CREATE INDEX idx_interactions_listing
    ON user_listing_interactions(listing_id, interaction_type);

-- Index tra cứu theo session (cho anonymous recommendation)
CREATE INDEX idx_interactions_session
    ON user_listing_interactions(session_id, created_at DESC)
    WHERE session_id IS NOT NULL;
