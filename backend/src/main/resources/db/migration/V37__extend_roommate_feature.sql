-- ============================================================
-- V37: ROOMMATE — Mở rộng hồ sơ ở ghép (profile_type, listing_id, capacity, interest tracking)
-- ============================================================

-- Thêm loại hồ sơ: SEEKING_ROOM (tìm phòng) hoặc HAS_ROOM (đã có phòng, tìm người ghép)
ALTER TABLE roommate_profiles
    ADD COLUMN profile_type VARCHAR(20) NOT NULL DEFAULT 'SEEKING_ROOM',
    ADD COLUMN listing_id   BIGINT REFERENCES listings(id) ON DELETE SET NULL,
    ADD COLUMN max_occupants     INT DEFAULT NULL,
    ADD COLUMN current_occupants INT DEFAULT NULL;

ALTER TABLE roommate_profiles
    ADD CONSTRAINT chk_roommate_profile_type CHECK (profile_type IN ('SEEKING_ROOM', 'HAS_ROOM')),
    ADD CONSTRAINT chk_roommate_occupants CHECK (
        max_occupants IS NULL OR (max_occupants >= 2)
    ),
    ADD CONSTRAINT chk_roommate_current_occupants CHECK (
        current_occupants IS NULL OR (current_occupants >= 0)
    );

CREATE INDEX idx_roommate_profiles_type    ON roommate_profiles(profile_type);
CREATE INDEX idx_roommate_profiles_listing ON roommate_profiles(listing_id) WHERE listing_id IS NOT NULL;

-- Thêm cột theo dõi sự quan tâm hai chiều cho mỗi cặp gợi ý
ALTER TABLE roommate_matches
    ADD COLUMN profile_a_interested BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN profile_b_interested BOOLEAN NOT NULL DEFAULT FALSE;
