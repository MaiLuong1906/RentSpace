-- V11: Thêm các trường đánh giá chi tiết cho reviews (Vệ sinh, An ninh, Thái độ chủ)
ALTER TABLE reviews ADD COLUMN cleanliness_rating INT CHECK (cleanliness_rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN security_rating INT CHECK (security_rating BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN landlord_rating INT CHECK (landlord_rating BETWEEN 1 AND 5);
