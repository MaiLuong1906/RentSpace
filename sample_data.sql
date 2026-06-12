-- Thiết lập bộ mã hóa ký tự là UTF-8 để tránh lỗi hiển thị tiếng Việt trên Windows
SET client_encoding = 'UTF8';

-- 1. Xóa sạch dữ liệu cũ theo đúng thứ tự ràng buộc khóa ngoại
TRUNCATE TABLE roommate_matches CASCADE;
TRUNCATE TABLE roommate_lifestyle_tags CASCADE;
TRUNCATE TABLE roommate_profiles CASCADE;
TRUNCATE TABLE listing_images CASCADE;
TRUNCATE TABLE reviews CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE conversations CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE listings CASCADE;
TRUNCATE TABLE users CASCADE;

-- 2. Reset các sequence ID về lại 1
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE listings_id_seq RESTART WITH 1;
ALTER SEQUENCE listing_images_id_seq RESTART WITH 1;
ALTER SEQUENCE conversations_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE reports_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE roommate_profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE roommate_matches_id_seq RESTART WITH 1;

-- ====================================================================
-- 3. TẠO TÀI KHOẢN NGƯỜI DÙNG (Mật khẩu mặc định là: 123456)
-- Hash Bcrypt: $2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu
-- ====================================================================
INSERT INTO users (email, password, full_name, phone_number, role, kyc_status, is_active, is_email_verified) VALUES
-- Admin hệ thống
('admin@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Hệ thống Admin', '0901000000', 'ADMIN', 'VERIFIED', true, true),

-- Landlords (Chủ nhà đăng tin)
('landlord1@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Nguyễn Văn Hùng (Chủ trọ)', '0901000001', 'LANDLORD', 'VERIFIED', true, true),
('landlord2@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Trần Thị Mai (Chung cư mini)', '0901000002', 'LANDLORD', 'VERIFIED', true, true),
('landlord3@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Lê Hoàng Nam (Homestay)', '0901000003', 'LANDLORD', 'PENDING', true, false),

-- Tenants (Người thuê tìm phòng)
('tenant1@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Phan Minh Tuấn (Sinh viên)', '0901000004', 'TENANT', 'VERIFIED', true, true),
('tenant2@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Vũ Thị Hồng (Nhân viên VP)', '0901000005', 'TENANT', 'VERIFIED', true, true),
('tenant3@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Đỗ Anh Dũng (KYC Pending)', '0901000006', 'TENANT', 'PENDING', true, false),
('tenant4@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Bùi Lan Anh', '0901000007', 'TENANT', 'VERIFIED', true, true),
('tenant5@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Nguyễn Minh Hoàng (Hà Nội)', '0901000008', 'TENANT', 'VERIFIED', true, true),
('tenant6@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Lê Thảo Vy (TP. HCM)', '0901000009', 'TENANT', 'VERIFIED', true, true),
('tenant7@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Phạm Quốc Anh (Hà Nội)', '0901000010', 'TENANT', 'VERIFIED', true, true),
('tenant8@rentspace.com', '$2a$12$hlBeNhhPHUOmbFYCWPSw2OmSRWiMXriiHUKMswuYod0XQu0mgMqYu', 'Trần Thu Hà (TP. HCM)', '0901000011', 'TENANT', 'VERIFIED', true, true);


-- ====================================================================
-- 4. TẠO DANH SÁCH BẤT ĐỘNG SẢN (LISTINGS) - Đa dạng vùng miền & phân khúc
-- ====================================================================
INSERT INTO listings (landlord_id, title, description, address, ward, district, city, latitude, longitude, price_per_month, area_m2, num_bedrooms, num_bathrooms, has_wifi, has_parking, has_air_conditioner, has_washing_machine, allow_pets, status, created_at, updated_at) VALUES
-- Đà Nẵng
((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Phòng trọ cao cấp gần ĐH Bách Khoa Đà Nẵng', 
'Phòng khép kín sạch sẽ thoáng mát, giờ giấc tự do không chung chủ, có camera an ninh 24/7. Phù hợp cho 2-3 bạn sinh viên.', 
'123 Nguyễn Lương Bằng', 'Hòa Khánh Bắc', 'Liên Chiểu', 'Đà Nẵng', 16.074567, 108.152345, 
2500000, 25.5, 1, 1, true, true, true, false, false, 'ACTIVE', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

((SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 
'Chung cư mini view sông Hàn, đầy đủ nội thất', 
'Căn hộ dịch vụ có ban công rộng, đầy đủ giường tủ, tủ lạnh, điều hòa. Miễn phí dịch vụ dọn phòng 1 lần/tuần.', 
'88 Trần Hưng Đạo', 'An Hải Tây', 'Sơn Trà', 'Đà Nẵng', 16.062012, 108.230987, 
6500000, 45.0, 1, 1, true, true, true, true, true, 'ACTIVE', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Hà Nội
((SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 
'Nhà nguyên căn 3 tầng ngõ Cầu Giấy', 
'Phù hợp cho hộ gia đình hoặc nhóm bạn đi làm ở ghép. Nhà gồm 3 phòng ngủ thoáng mát, khu dân trí cao cực kỳ an ninh.', 
'Ngõ 165 Cầu Giấy', 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội', 21.033893, 105.798412, 
12000000, 80.0, 3, 2, true, true, true, true, false, 'ACTIVE', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days'),

((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Phòng trọ sinh viên giá rẻ gần ĐH Quốc Gia', 
'Phòng trọ khép kín cơ bản giá sinh viên, có gác lửng, điện nước tính theo công tơ nhà nước.', 
'Số 42 Trần Quốc Hoàn', 'Dịch Vọng Hậu', 'Cầu Giấy', 'Hà Nội', 21.039234, 105.789123, 
1800000, 18.0, 1, 1, true, true, false, false, false, 'ACTIVE', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- TP. Hồ Chí Minh
((SELECT id FROM users WHERE email = 'landlord3@rentspace.com'), 
'Căn hộ dịch vụ tiện nghi trung tâm Quận 3', 
'Gần các văn phòng, trường đại học lớn. Nội thất cao cấp nhập khẩu, an ninh thẻ từ thang máy.', 
'250 Nguyễn Đình Chiểu', 'Võ Thị Sáu', 'Quận 3', 'Hồ Chí Minh', 10.778912, 106.690123, 
8500000, 35.0, 1, 1, true, true, true, true, true, 'INACTIVE', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
'Phòng studio tiện nghi gần Landmark 81', 
'Đầy đủ tiện ích cao cấp, khu giặt sấy riêng, khóa vân tay, có sân thượng sinh hoạt chung cực thoáng mát.', 
'15/8 Nguyễn Hữu Cảnh', 'Phường 22', 'Bình Thạnh', 'Hồ Chí Minh', 10.793245, 106.719876, 
4800000, 28.0, 1, 1, true, true, true, true, false, 'RENTED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days');


-- ====================================================================
-- 5. TẠO HÌNH ẢNH TIN ĐĂNG (LISTING IMAGES)
-- ====================================================================
INSERT INTO listing_images (listing_id, image_url, display_order, created_at) VALUES
-- Đà Nẵng - ĐH Bách Khoa
((SELECT id FROM listings WHERE title = 'Phòng trọ cao cấp gần ĐH Bách Khoa Đà Nẵng'), 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', 1, NOW()),
((SELECT id FROM listings WHERE title = 'Phòng trọ cao cấp gần ĐH Bách Khoa Đà Nẵng'), 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop', 2, NOW()),
-- Đà Nẵng - View sông Hàn
((SELECT id FROM listings WHERE title = 'Chung cư mini view sông Hàn, đầy đủ nội thất'), 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop', 1, NOW()),
((SELECT id FROM listings WHERE title = 'Chung cư mini view sông Hàn, đầy đủ nội thất'), 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', 2, NOW()),
-- Hà Nội - Nhà nguyên căn 3 tầng
((SELECT id FROM listings WHERE title = 'Nhà nguyên căn 3 tầng ngõ Cầu Giấy'), 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop', 1, NOW()),
-- Hà Nội - Phòng trọ ĐH Quốc Gia
((SELECT id FROM listings WHERE title = 'Phòng trọ sinh viên giá rẻ gần ĐH Quốc Gia'), 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=600&fit=crop', 1, NOW()),
-- HCM - Quận 3
((SELECT id FROM listings WHERE title = 'Căn hộ dịch vụ tiện nghi trung tâm Quận 3'), 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&h=600&fit=crop', 1, NOW()),
-- HCM - Landmark 81
((SELECT id FROM listings WHERE title = 'Phòng studio tiện nghi gần Landmark 81'), 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', 1, NOW());


-- ====================================================================
-- 6. TẠO ĐÁNH GIÁ (REVIEWS)
-- ====================================================================
INSERT INTO reviews (listing_id, tenant_id, rating, comment, created_at, updated_at) VALUES
((SELECT id FROM listings WHERE title = 'Phòng trọ cao cấp gần ĐH Bách Khoa Đà Nẵng'), 
 (SELECT id FROM users WHERE email = 'tenant1@rentspace.com'), 5, 'Phòng sạch đẹp, chủ nhà nhiệt tình hỗ trợ nhiệt tình lắm nha.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

((SELECT id FROM listings WHERE title = 'Chung cư mini view sông Hàn, đầy đủ nội thất'), 
 (SELECT id FROM users WHERE email = 'tenant2@rentspace.com'), 4, 'Phòng view đẹp, máy lạnh mát. Điểm trừ là wifi đôi lúc hơi chập chờn vào giờ cao điểm.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

((SELECT id FROM listings WHERE title = 'Nhà nguyên căn 3 tầng ngõ Cầu Giấy'), 
 (SELECT id FROM users WHERE email = 'tenant4@rentspace.com'), 5, 'Nhà rộng rãi, kiệt an ninh. Gia đình mình ở rất thoải mái.', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days');


-- ====================================================================
-- 7. TẠO LỊCH SỬ CHAT (CONVERSATIONS & MESSAGES)
-- ====================================================================
-- Cuộc trò chuyện 1: Phan Minh Tuấn (Tenant 1) và Nguyễn Văn Hùng (Landlord 1)
INSERT INTO conversations (tenant_id, landlord_id, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'tenant1@rentspace.com'), 
 (SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), NOW() - INTERVAL '1 hours', NOW() - INTERVAL '10 minutes');

INSERT INTO messages (conversation_id, sender_id, content, is_read, message_type, file_url, created_at) VALUES
((SELECT id FROM conversations WHERE tenant_id = (SELECT id FROM users WHERE email = 'tenant1@rentspace.com') AND landlord_id = (SELECT id FROM users WHERE email = 'landlord1@rentspace.com')),
 (SELECT id FROM users WHERE email = 'tenant1@rentspace.com'), 'Dạ em chào anh Hùng, phòng gần Bách Khoa của mình còn không ạ?', true, 'TEXT', NULL, NOW() - INTERVAL '45 minutes'),

((SELECT id FROM conversations WHERE tenant_id = (SELECT id FROM users WHERE email = 'tenant1@rentspace.com') AND landlord_id = (SELECT id FROM users WHERE email = 'landlord1@rentspace.com')),
 (SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 'Chào em, phòng đó vẫn còn em nhé. Em muốn khi nào qua xem phòng?', true, 'TEXT', NULL, NOW() - INTERVAL '40 minutes'),

((SELECT id FROM conversations WHERE tenant_id = (SELECT id FROM users WHERE email = 'tenant1@rentspace.com') AND landlord_id = (SELECT id FROM users WHERE email = 'landlord1@rentspace.com')),
 (SELECT id FROM users WHERE email = 'tenant1@rentspace.com'), 'Chiều mai tầm 5h em qua xem được không anh?', false, 'TEXT', NULL, NOW() - INTERVAL '10 minutes');

-- Cuộc trò chuyện 2: Vũ Thị Hồng (Tenant 2) và Trần Thị Mai (Landlord 2)
INSERT INTO conversations (tenant_id, landlord_id, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'tenant2@rentspace.com'), 
 (SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days');

INSERT INTO messages (conversation_id, sender_id, content, is_read, message_type, file_url, created_at) VALUES
((SELECT id FROM conversations WHERE tenant_id = (SELECT id FROM users WHERE email = 'tenant2@rentspace.com') AND landlord_id = (SELECT id FROM users WHERE email = 'landlord2@rentspace.com')),
 (SELECT id FROM users WHERE email = 'tenant2@rentspace.com'), 'Chị Mai ơi, chung cư mini bên Trần Hưng Đạo có chỗ đỗ ô tô không chị?', true, 'TEXT', NULL, NOW() - INTERVAL '1 days 5 hours'),

((SELECT id FROM conversations WHERE tenant_id = (SELECT id FROM users WHERE email = 'tenant2@rentspace.com') AND landlord_id = (SELECT id FROM users WHERE email = 'landlord2@rentspace.com')),
 (SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 'Dạ bên chị chỉ hỗ trợ đỗ xe máy thôi em ạ. Em xem hình ảnh định vị bãi đỗ xe ô tô gần nhà chị gửi ở dưới nhé.', true, 'TEXT', NULL, NOW() - INTERVAL '1 days 4 hours'),

((SELECT id FROM conversations WHERE tenant_id = (SELECT id FROM users WHERE email = 'tenant2@rentspace.com') AND landlord_id = (SELECT id FROM users WHERE email = 'landlord2@rentspace.com')),
 (SELECT id FROM users WHERE email = 'landlord2@rentspace.com'), 'Hình ảnh sơ đồ bãi đỗ xe', true, 'IMAGE', 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&h=600&fit=crop', NOW() - INTERVAL '1 days 4 hours');


-- ====================================================================
-- 8. TẠO BÁO CÁO VI PHẠM (REPORTS)
-- ====================================================================
INSERT INTO reports (reporter_id, listing_id, reason, description, status, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'tenant3@rentspace.com'), 
 (SELECT id FROM listings WHERE title = 'Phòng trọ sinh viên giá rẻ gần ĐH Quốc Gia'), 
 'SAI_THONG_TIN', 'Ảnh chụp phòng trọ và diện tích thực tế khác xa quảng cáo, phòng ẩm mốc hư hại nặng.', 'PENDING', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');


-- ====================================================================
-- 9. TẠO THÔNG BÁO (NOTIFICATIONS)
-- ====================================================================
INSERT INTO notifications (user_id, title, content, type, is_read, created_at) VALUES
-- Cho chủ nhà Hùng
((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
 'Yêu cầu xác thực tài khoản KYC thành công', 'Hồ sơ KYC của bạn đã được Admin phê duyệt. Bạn hiện đã có thể bắt đầu đăng tin phòng trọ.', 'KYC', true, NOW() - INTERVAL '10 days'),

((SELECT id FROM users WHERE email = 'landlord1@rentspace.com'), 
 'Tin đăng của bạn đã được duyệt', 'Tin đăng "Phòng trọ cao cấp gần ĐH Bách Khoa Đà Nẵng" của bạn đã được kiểm duyệt và chuyển trạng thái hoạt động.', 'LISTING', false, NOW() - INTERVAL '5 days'),

-- Cho người thuê Hồng
((SELECT id FROM users WHERE email = 'tenant2@rentspace.com'), 
 'Tài khoản đã được xác thực', 'Hồ sơ KYC cá nhân của bạn đã được xác minh thành công.', 'KYC', true, NOW() - INTERVAL '3 days'),

-- Thông báo hệ thống cho Admin
((SELECT id FROM users WHERE email = 'admin@rentspace.com'), 
 'Có tin đăng mới đang chờ duyệt', 'Chủ nhà Lê Hoàng Nam vừa gửi yêu cầu đăng duyệt tin mới tại Quận 3, TP.HCM.', 'SYSTEM', false, NOW() - INTERVAL '4 days');


-- ====================================================================
-- 10. TẠO HỒ SƠ TÌM BẠN Ở GHÉP (ROOMMATE PROFILES)
-- ====================================================================
INSERT INTO roommate_profiles (user_id, gender, occupation, budget_min, budget_max, preferred_area, move_in_date, bio, is_active, created_at, updated_at) VALUES
-- tenant1 (Nam, Sinh viên, Cầu Giấy, Hà Nội)
((SELECT id FROM users WHERE email = 'tenant1@rentspace.com'), 'Nam', 'Sinh viên', 1000000, 2500000, 'Cầu Giấy, Hà Nội', CURRENT_DATE + 5, 'Mình là Tuấn, sinh viên Bách Khoa, muốn tìm bạn nam ở ghép khu vực Cầu Giấy sạch sẽ, gọn gàng.', true, NOW(), NOW()),

-- tenant2 (Nữ, VP, Quận 1, Hồ Chí Minh)
((SELECT id FROM users WHERE email = 'tenant2@rentspace.com'), 'Nữ', 'Nhân viên văn phòng', 2500000, 4500000, 'Quận 1, Hồ Chí Minh', CURRENT_DATE + 10, 'Mình tên Hồng, đang làm văn phòng ở Quận 1, thích nuôi mèo, tìm bạn nữ hòa đồng, tôn trọng không gian riêng.', true, NOW(), NOW()),

-- tenant3 (Nam, Đà Nẵng nhưng KYC PENDING -> Không match)
((SELECT id FROM users WHERE email = 'tenant3@rentspace.com'), 'Nam', 'Tự do', 1500000, 3000000, 'Liên Chiểu, Đà Nẵng', CURRENT_DATE + 7, 'Mình là Dũng, tìm bạn ghép ở Đà Nẵng.', true, NOW(), NOW()),

-- tenant4 (Nữ, VP, Quận 12, Hồ Chí Minh -> Cùng thành phố khác quận với tenant2)
((SELECT id FROM users WHERE email = 'tenant4@rentspace.com'), 'Nữ', 'Nhân viên văn phòng', 3000000, 5000000, 'Quận 12, Hồ Chí Minh', CURRENT_DATE + 12, 'Mình là Anh, tìm bạn nữ văn phòng ở ghép khu vực Quận 12 hoặc lân cận.', true, NOW(), NOW()),

-- tenant5 (Nam, Sinh viên, Cầu Giấy, Hà Nội -> Trùng district & city với tenant1)
((SELECT id FROM users WHERE email = 'tenant5@rentspace.com'), 'Nam', 'Sinh viên', 1200000, 2200000, 'Cầu Giấy, Hà Nội', CURRENT_DATE + 4, 'Minh Hoàng, thích thể thao, không hút thuốc, tìm bạn nam ở ghép Cầu Giấy.', true, NOW(), NOW()),

-- tenant6 (Nữ, Sinh viên, Quận 1, Hồ Chí Minh -> Trùng district & city với tenant2)
((SELECT id FROM users WHERE email = 'tenant6@rentspace.com'), 'Nữ', 'Sinh viên', 2000000, 4000000, 'Quận 1, Hồ Chí Minh', CURRENT_DATE + 8, 'Thảo Vy, sinh viên năm 3, cần tìm bạn nữ ở chung phòng studio trung tâm Quận 1.', true, NOW(), NOW()),

-- tenant7 (Nam, VP, Nam Từ Liêm, Hà Nội -> Khác quận cùng thành phố với tenant1)
((SELECT id FROM users WHERE email = 'tenant7@rentspace.com'), 'Nam', 'Nhân viên văn phòng', 1500000, 3000000, 'Nam Từ Liêm, Hà Nội', CURRENT_DATE + 6, 'Quốc Anh, hiền lành, thích yên tĩnh, tìm bạn nam ghép căn hộ Nam Từ Liêm.', true, NOW(), NOW()),

-- tenant8 (Nữ, VP, Quận 3, Hồ Chí Minh -> Khác quận cùng thành phố với tenant2)
((SELECT id FROM users WHERE email = 'tenant8@rentspace.com'), 'Nữ', 'Nhân viên văn phòng', 2500000, 4000000, 'Quận 3, Hồ Chí Minh', CURRENT_DATE + 9, 'Thu Hà, hướng ngoại, yêu chó mèo, tìm bạn nữ ghép căn hộ dịch vụ Quận 3.', true, NOW(), NOW());


-- ====================================================================
-- 11. TẠO LỐI SỐNG (ROOMMATE LIFESTYLE TAGS)
-- ====================================================================
INSERT INTO roommate_lifestyle_tags (profile_id, tag) VALUES
-- tenant1 (Tuấn): Quiet, Clean, Non-smoker
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant1@rentspace.com')), 'Quiet'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant1@rentspace.com')), 'Clean'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant1@rentspace.com')), 'Non-smoker'),

-- tenant2 (Hồng): Friendly, Clean, Pet-friendly
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant2@rentspace.com')), 'Friendly'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant2@rentspace.com')), 'Clean'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant2@rentspace.com')), 'Pet-friendly'),

-- tenant3 (Dũng): Non-smoker, Quiet
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant3@rentspace.com')), 'Non-smoker'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant3@rentspace.com')), 'Quiet'),

-- tenant4 (Anh): Clean, Quiet, Friendly
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant4@rentspace.com')), 'Clean'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant4@rentspace.com')), 'Quiet'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant4@rentspace.com')), 'Friendly'),

-- tenant5 (Hoàng): Quiet, Clean, Non-smoker
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant5@rentspace.com')), 'Quiet'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant5@rentspace.com')), 'Clean'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant5@rentspace.com')), 'Non-smoker'),

-- tenant6 (Vy): Friendly, Clean, Quiet
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant6@rentspace.com')), 'Friendly'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant6@rentspace.com')), 'Clean'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant6@rentspace.com')), 'Quiet'),

-- tenant7 (Quốc Anh): Non-smoker, Friendly, Quiet
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant7@rentspace.com')), 'Non-smoker'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant7@rentspace.com')), 'Friendly'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant7@rentspace.com')), 'Quiet'),

-- tenant8 (Hà): Friendly, Pet-friendly, Clean
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant8@rentspace.com')), 'Friendly'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant8@rentspace.com')), 'Pet-friendly'),
((SELECT id FROM roommate_profiles WHERE user_id = (SELECT id FROM users WHERE email = 'tenant8@rentspace.com')), 'Clean');
