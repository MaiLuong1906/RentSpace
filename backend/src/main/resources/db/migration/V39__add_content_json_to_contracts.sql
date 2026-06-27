-- Phase 4 fix: thêm content_json JSONB để AI assistant đọc structured data
-- thay vì parse HTML từ content_snapshot
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS content_json JSONB;
