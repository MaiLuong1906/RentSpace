-- ============================================================
-- V20: FIX COLLECTION TABLES — Chuyển từ TEXT[] sang Join Tables
-- ============================================================

-- 1. Fix Deposit Dispute Evidence
ALTER TABLE deposit_disputes DROP COLUMN IF EXISTS evidence_urls;

CREATE TABLE IF NOT EXISTS deposit_dispute_evidence (
    dispute_id  BIGINT NOT NULL REFERENCES deposit_disputes(id) ON DELETE CASCADE,
    evidence_url TEXT NOT NULL
);

-- 2. Fix Post Images
ALTER TABLE posts DROP COLUMN IF EXISTS image_urls;

CREATE TABLE IF NOT EXISTS post_images (
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    image_url   TEXT NOT NULL
);

-- 3. Fix Roommate Lifestyle Tags
ALTER TABLE roommate_profiles DROP COLUMN IF EXISTS lifestyle_tags;

CREATE TABLE IF NOT EXISTS roommate_lifestyle_tags (
    profile_id  BIGINT NOT NULL REFERENCES roommate_profiles(id) ON DELETE CASCADE,
    tag         VARCHAR(100) NOT NULL
);
