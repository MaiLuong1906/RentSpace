-- Xóa dữ liệu cũ (reset để tránh rác)
TRUNCATE TABLE listings CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequence id (tuỳ chọn)
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE listings_id_seq RESTART WITH 1;

-- ==========================================
-- 1. TẠO USERS (Mật khẩu mặc định là: 123456)
-- Hash Bcrypt cho '123456' là: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIui
-- ==========================================
INSERT INTO users (email, password, full_name, phone_number, role, kyc_status, is_active, is_email_verified) VALUES
-- Admin
('admin@rentspace.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIui', 'Hệ thống Admin', '0901000000', 'ADMIN', 'VERIFIED', true, true),

-- Landlords (Chủ nhà)
('landlord1@rentspace.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIui', 'Chủ nhà Trần A', '0901000001', 'LANDLORD', 'VERIFIED', true, true),
('landlord2@rentspace.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIui', 'Chủ nhà Nguyễn B', '0901000002', 'LANDLORD', 'PENDING', true, true),

-- Tenants (Người thuê)
('tenant1@rentspace.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIui', 'Người thuê Lê C', '0901000003', 'TENANT', 'PENDING', true, true),
('tenant2@rentspace.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIui', 'Người thuê Phạm D', '0901000004', 'TENANT', 'VERIFIED', true, true);

-- ==========================================
-- 2. TẠO LISTINGS (Tin đăng khớp V3 schema)
-- ==========================================
INSERT INTO listings (landlord_id, title, description, address, district, city, latitude, longitude, price_per_month, area_m2, num_bedrooms, num_bathrooms, has_wifi, has_parking, has_air_conditioner, has_washing_machine, allow_pets, status, created_at, updated_at) VALUES
-- Tin 1: Phòng trọ đang ACTIVE
((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Phòng trọ cao cấp gần ĐH Bách Khoa', 
'Phòng mới xây, đầy đủ nội thất cơ bản, giờ giấc tự do, an ninh tốt.', 
'123 Nguyễn Văn Cừ', 'Liên Chiểu', 'Đà Nẵng', 16.074567, 108.152345, 
3500000, 25.5, 1, 1, true, true, true, true, false, 'ACTIVE', NOW(), NOW()),

-- Tin 2: Chung cư mini PENDING chờ duyệt
((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Chung cư mini view biển Mỹ Khê', 
'Ban công rộng, thoáng mát, bao gồm dịch vụ dọn dẹp tuần 2 lần.', 
'45 Võ Nguyên Giáp', 'Sơn Trà', 'Đà Nẵng', 16.056789, 108.245678, 
6000000, 40.0, 1, 1, true, true, true, true, false, 'PENDING', NOW(), NOW()),

-- Tin 3: Nhà nguyên căn ACTIVE
((SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 
'Nhà nguyên căn kiệt ô tô Hải Phòng', 
'Phù hợp gia đình, 2 phòng ngủ, 1 phòng khách, 1 bếp.', 
'Kiệt 68 Hải Phòng', 'Hải Châu', 'Đà Nẵng', 16.067890, 108.213456, 
8500000, 75.0, 2, 2, true, true, false, false, true, 'ACTIVE', NOW(), NOW()),

-- Tin 4: Phòng ngăn gian đã RENTED (được thuê)
((SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 
'Phòng ngăn gian giá sinh viên', 
'Giá rẻ, chung chủ, an ninh tốt, gần chợ.', 
'70 Tôn Đức Thắng', 'Liên Chiểu', 'Đà Nẵng', 16.054321, 108.167890, 
1500000, 15.0, 1, 1, true, true, false, false, false, 'RENTED', NOW(), NOW());

-- ==========================================
-- 3. TẠO LISTING IMAGES (Ảnh tin đăng)
-- ==========================================
INSERT INTO listing_images (listing_id, image_url, display_order, created_at) VALUES
((SELECT id FROM listings WHERE title = 'Phòng trọ cao cấp gần ĐH Bách Khoa'), 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', 1, NOW()),
((SELECT id FROM listings WHERE title = 'Chung cư mini view biển Mỹ Khê'), 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 1, NOW()),
((SELECT id FROM listings WHERE title = 'Nhà nguyên căn kiệt ô tô Hải Phòng'), 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop', 1, NOW()),
((SELECT id FROM listings WHERE title = 'Phòng ngăn gian giá sinh viên'), 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop', 1, NOW());
