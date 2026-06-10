-- ============================================================
-- V21: Cập nhật ràng buộc type của bảng notifications
-- Hỗ trợ các loại thông báo mới: DEPOSIT, PAYMENT, ROOMMATE
-- ============================================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('SYSTEM', 'CHAT', 'KYC', 'LISTING', 'DEPOSIT', 'PAYMENT', 'ROOMMATE'));
