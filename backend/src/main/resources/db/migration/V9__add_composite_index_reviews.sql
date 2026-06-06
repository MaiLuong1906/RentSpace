-- V9: Tạo index composite cho reviews (listing_id, created_at DESC) để tối ưu hiệu năng đọc danh sách đánh giá phân trang mới nhất
CREATE INDEX idx_reviews_listing_created_at_desc ON reviews(listing_id, created_at DESC);
