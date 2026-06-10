-- ============================================================
-- V15: POSTS — Bài đăng cộng đồng
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
    id              BIGSERIAL PRIMARY KEY,
    author_id       BIGINT NOT NULL REFERENCES users(id),
    type            VARCHAR(30) NOT NULL
                    CHECK (type IN (
                        'ROOMMATE',     -- Tìm bạn ở ghép
                        'TIPS',         -- Tips & Kinh nghiệm
                        'REVIEW',       -- Review phòng trọ / khu vực
                        'QUESTION'      -- Hỏi đáp
                    )),
    content         TEXT NOT NULL,
    image_urls      TEXT[],
    related_listing BIGINT REFERENCES listings(id),
    district        VARCHAR(100),
    like_count      INTEGER DEFAULT 0,
    comment_count   INTEGER DEFAULT 0,
    report_count    INTEGER DEFAULT 0,
    is_hidden       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id     BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id   BIGINT NOT NULL REFERENCES users(id),
    content     TEXT NOT NULL,
    is_hidden   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reports (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL REFERENCES posts(id),
    reporter_id BIGINT NOT NULL REFERENCES users(id),
    reason      VARCHAR(50) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
