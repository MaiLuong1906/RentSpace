-- ============================================================
-- V23: PAYMENT — Tích hợp MoMo (Mở rộng từ VNPay hiện tại)
-- ============================================================
ALTER TABLE deposit_transactions 
    ADD COLUMN payment_method_detail JSONB;
