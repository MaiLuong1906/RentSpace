-- V2: Tạo bảng listings (tin đăng phòng trọ)
CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    landlord_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 0) NOT NULL,          -- Giá thuê/tháng (VNĐ)
    deposit DECIMAL(12, 0),                  -- Tiền đặt cọc
    area DECIMAL(6, 2),                      -- Diện tích (m²)
    address TEXT NOT NULL,
    district VARCHAR(100),
    city VARCHAR(100) NOT NULL DEFAULT 'Đà Nẵng',
    -- PostGIS geography point (longitude, latitude)
    location GEOGRAPHY(POINT, 4326),
    room_type VARCHAR(50) CHECK (room_type IN ('PHONG_TRO', 'CHUNG_CU_MINI', 'CHUNG_CU', 'NGAN_GIAN', 'NHA_NGUYEN_CAN')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'RENTED', 'HIDDEN', 'REJECTED')),
    -- Tiện nghi (JSON array)
    amenities JSONB DEFAULT '[]',
    -- Ảnh (JSON array of URLs)
    image_urls JSONB DEFAULT '[]',
    average_rating DECIMAL(2, 1) DEFAULT 0,
    review_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_landlord_id ON listings(landlord_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_price ON listings(price);
-- Spatial index cho tìm kiếm theo bán kính địa lý
CREATE INDEX idx_listings_location ON listings USING GIST(location);
