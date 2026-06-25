-- Phase 4 Sprint 1: Hệ thống đánh giá 2 chiều theo giao dịch
-- Khác với bảng reviews (V8) — đây là transaction-based, blind review,
-- tự publish sau 30 ngày hoặc khi cả 2 bên đã gửi.

CREATE TABLE transaction_reviews (
    id                  BIGSERIAL PRIMARY KEY,
    deposit_id          BIGINT       NOT NULL REFERENCES deposit_transactions(id) ON DELETE CASCADE,
    reviewer_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_role       VARCHAR(20)  NOT NULL CHECK (reviewer_role IN ('TENANT','LANDLORD')),

    -- Nội dung đánh giá
    rating              SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment             TEXT,

    -- Blind review: ẩn đến khi cả 2 bên đã gửi HOẶC hết hạn 30 ngày
    is_published        BOOLEAN      NOT NULL DEFAULT FALSE,
    published_at        TIMESTAMPTZ,

    -- Kiểm duyệt
    is_flagged          BOOLEAN      NOT NULL DEFAULT FALSE,
    flag_reason         TEXT,

    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    -- Mỗi giao dịch chỉ được review một lần theo chiều
    CONSTRAINT uq_deposit_reviewer UNIQUE (deposit_id, reviewer_id)
);

-- Tổng hợp rating của mỗi user (được cập nhật khi review publish)
CREATE TABLE user_rating_summary (
    user_id             BIGINT       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_reviews       INT          NOT NULL DEFAULT 0,
    average_rating      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    rating_1_count      INT          NOT NULL DEFAULT 0,
    rating_2_count      INT          NOT NULL DEFAULT 0,
    rating_3_count      INT          NOT NULL DEFAULT 0,
    rating_4_count      INT          NOT NULL DEFAULT 0,
    rating_5_count      INT          NOT NULL DEFAULT 0,
    last_updated        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_txn_reviews_deposit    ON transaction_reviews(deposit_id);
CREATE INDEX idx_txn_reviews_reviewer   ON transaction_reviews(reviewer_id);
CREATE INDEX idx_txn_reviews_reviewee   ON transaction_reviews(reviewee_id);
CREATE INDEX idx_txn_reviews_published  ON transaction_reviews(is_published, created_at);
