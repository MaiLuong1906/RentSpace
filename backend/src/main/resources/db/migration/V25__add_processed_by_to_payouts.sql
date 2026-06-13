-- ============================================================
-- V25: Add processed_by column to payouts for audit log
-- ============================================================

ALTER TABLE payouts ADD COLUMN processed_by VARCHAR(100);
