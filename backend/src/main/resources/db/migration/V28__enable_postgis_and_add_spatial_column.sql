-- V28__enable_postgis_and_add_spatial_column.sql
-- Kích hoạt PostGIS và thêm cột geom kiểu Point để tìm kiếm không gian hiệu năng cao
-- Author: Leon | Date: 2026-06-23

-- 1. Kích hoạt PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Thêm cột geom kiểu geometry(Point, 4326) vào bảng listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- 3. Đồng bộ hóa dữ liệu tọa độ hiện tại sang cột geom
UPDATE listings 
SET geom = ST_SetSRID(ST_Point(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Tạo Spatial Index (GIST) trên cột geom để tăng tốc truy vấn địa lý
CREATE INDEX IF NOT EXISTS idx_listings_geom ON listings USING GIST(geom);

-- 5. Tạo Trigger tự động đồng bộ hóa cột geom khi chèn mới hoặc cập nhật latitude, longitude
CREATE OR REPLACE FUNCTION update_listings_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom := ST_SetSRID(ST_Point(NEW.longitude, NEW.latitude), 4326);
    ELSE
        NEW.geom := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger trên bảng listings
DROP TRIGGER IF EXISTS trg_update_listings_geom ON listings;
CREATE TRIGGER trg_update_listings_geom
    BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_listings_geom();
