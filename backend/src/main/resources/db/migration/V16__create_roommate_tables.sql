-- ============================================================
-- V16: ROOMMATE — Hồ sơ tìm bạn ở ghép
-- ============================================================
CREATE TABLE IF NOT EXISTS roommate_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) UNIQUE,
    gender          VARCHAR(20),
    occupation      VARCHAR(100),
    budget_min      BIGINT,
    budget_max      BIGINT,
    preferred_area  VARCHAR(255),
    move_in_date    DATE,
    bio             TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roommate_lifestyle_tags (
    profile_id  BIGINT NOT NULL REFERENCES roommate_profiles(id) ON DELETE CASCADE,
    tag         VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS roommate_matches (
    id              BIGSERIAL PRIMARY KEY,
    profile_a_id    BIGINT NOT NULL REFERENCES roommate_profiles(id),
    profile_b_id    BIGINT NOT NULL REFERENCES roommate_profiles(id),
    match_score     DECIMAL(5,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'SUGGESTED'
                    CHECK (status IN ('SUGGESTED', 'VIEWED', 'CONTACTED', 'DISMISSED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (profile_a_id, profile_b_id)
);

CREATE INDEX IF NOT EXISTS idx_roommate_profiles_active ON roommate_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_roommate_matches_score ON roommate_matches(match_score DESC);
