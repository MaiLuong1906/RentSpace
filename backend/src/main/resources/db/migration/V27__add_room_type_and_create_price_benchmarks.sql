-- V27__add_room_type_and_create_price_benchmarks.sql
-- Thêm room_type vào listings và tạo bảng price_benchmarks cho gợi ý giá thuê
-- Author: Leon | Date: 2026-06-23

-- 1. Thêm cột room_type vào bảng listings
ALTER TABLE listings 
    ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) 
        CHECK (room_type IN ('PHONG_TRO', 'CHUNG_CU_MINI', 'CHUNG_CU', 'NGAN_GIAN', 'NHA_NGUYEN_CAN'));

-- Backfill dữ liệu hiện có thành 'PHONG_TRO' làm mặc định
UPDATE listings SET room_type = 'PHONG_TRO' WHERE room_type IS NULL;

-- Đặt cột room_type thành NOT NULL sau khi đã backfill
ALTER TABLE listings ALTER COLUMN room_type SET NOT NULL;

-- 2. Tạo bảng price_benchmarks để lưu kết quả phân vị tính toán sẵn
CREATE TABLE IF NOT EXISTS price_benchmarks (
    id              BIGSERIAL PRIMARY KEY,
    city            VARCHAR(100) NOT NULL,           -- 'Đà Nẵng' | 'Hà Nội' | 'Hồ Chí Minh'
    district        VARCHAR(100) NOT NULL,
    room_type       VARCHAR(50) NOT NULL,
    area_bucket     VARCHAR(20) NOT NULL,            -- '0-20' | '20-30' | '30-50' | '50+'
    p25_price       BIGINT NOT NULL,
    p50_price       BIGINT NOT NULL,
    p75_price       BIGINT NOT NULL,
    sample_count    INTEGER NOT NULL,
    data_source     VARCHAR(20) NOT NULL DEFAULT 'LISTING'
                    CHECK (data_source IN ('DEPOSIT', 'LISTING')),
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tạo Unique Constraint để đảm bảo mỗi nhóm chỉ có 1 dòng benchmark
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_bench_unique ON price_benchmarks(city, district, room_type, area_bucket);

-- Thêm comment giải thích
COMMENT ON TABLE price_benchmarks IS 'Bảng lưu các mốc phân vị giá thuê P25, P50, P75 của từng khu vực để phục vụ gợi ý giá';
