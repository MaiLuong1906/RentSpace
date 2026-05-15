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
-- 2. TẠO LISTINGS (Tin đăng)
-- ==========================================
INSERT INTO listings (landlord_id, title, description, price, deposit, area, address, district, city, room_type, status, amenities, location) VALUES
-- Tin 1: Phòng trọ đang ACTIVE
((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Phòng trọ cao cấp gần ĐH Bách Khoa', 
'Phòng mới xây, đầy đủ nội thất cơ bản, giờ giấc tự do, an ninh tốt.', 
3500000, 3500000, 25.5, '123 Nguyễn Văn Cừ', 'Liên Chiểu', 'Đà Nẵng', 'PHONG_TRO', 'ACTIVE', 
'["wifi", "dieu_hoa", "may_giat", "cho_de_xe"]'::jsonb, 
ST_SetSRID(ST_MakePoint(108.152345, 16.074567), 4326)),

-- Tin 2: Chung cư mini PENDING chờ duyệt
((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Chung cư mini view biển Mỹ Khê', 
'Ban công rộng, thoáng mát, bao gồm dịch vụ dọn dẹp tuần 2 lần.', 
6000000, 6000000, 40.0, '45 Võ Nguyên Giáp', 'Sơn Trà', 'Đà Nẵng', 'CHUNG_CU_MINI', 'PENDING', 
'["wifi", "dieu_hoa", "may_giat", "tu_lanh", "thang_may"]'::jsonb, 
ST_SetSRID(ST_MakePoint(108.245678, 16.056789), 4326)),

-- Tin 3: Nhà nguyên căn ACTIVE
((SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 
'Nhà nguyên căn kiệt ô tô Hải Phòng', 
'Phù hợp gia đình, 2 phòng ngủ, 1 phòng khách, 1 bếp.', 
8500000, 8500000, 75.0, 'Kiệt 68 Hải Phòng', 'Hải Châu', 'Đà Nẵng', 'NHA_NGUYEN_CAN', 'ACTIVE', 
'["wifi", "cho_de_xe", "bep", "tu_lanh", "tivi"]'::jsonb, 
ST_SetSRID(ST_MakePoint(108.213456, 16.067890), 4326)),

-- Tin 4: Phòng ngăn gian đã RENTED (được thuê)
((SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 
'Phòng ngăn gian giá sinh viên', 
'Giá rẻ, chung chủ, an ninh tốt, gần chợ.', 
1500000, 1000000, 15.0, '70 Tôn Đức Thắng', 'Liên Chiểu', 'Đà Nẵng', 'NGAN_GIAN', 'RENTED', 
'["wifi", "cho_de_xe"]'::jsonb, 
ST_SetSRID(ST_MakePoint(108.167890, 16.054321), 4326));
