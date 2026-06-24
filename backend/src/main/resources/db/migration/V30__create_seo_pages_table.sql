-- Sprint 6: Bảng lưu SEO metadata cho các trang thành phố/quận huyện
CREATE TABLE seo_pages (
    id            BIGSERIAL PRIMARY KEY,
    path          VARCHAR(500) NOT NULL UNIQUE,
    title         VARCHAR(200),
    meta_desc     VARCHAR(500),
    h1            VARCHAR(200),
    last_modified TIMESTAMPTZ  DEFAULT NOW(),
    priority      DECIMAL(3,2) DEFAULT 0.5,
    change_freq   VARCHAR(20)  DEFAULT 'weekly'
                  CHECK (change_freq IN ('always','hourly','daily','weekly','monthly','yearly','never'))
);

CREATE INDEX idx_seo_pages_path ON seo_pages(path);
