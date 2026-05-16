-- V3: Drop old listings table (if exists) and recreate with new schema matching Listing entity
DROP TABLE IF EXISTS listings CASCADE;

CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    landlord_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    ward VARCHAR(255),
    district VARCHAR(255),
    city VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    price_per_month DECIMAL(15, 2) NOT NULL,
    area_m2 DECIMAL(6, 2),
    num_bedrooms INT,
    num_bathrooms INT,
    has_wifi BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_air_conditioner BOOLEAN DEFAULT FALSE,
    has_washing_machine BOOLEAN DEFAULT FALSE,
    allow_pets BOOLEAN DEFAULT FALSE,
    status VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_listing_landlord ON listings(landlord_id);
CREATE INDEX idx_listing_status ON listings(status);
CREATE INDEX idx_listing_location ON listings(latitude, longitude);

-- Create listing_images table matching ListingImage entity
CREATE TABLE listing_images (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    display_order INT,
    created_at TIMESTAMP
);
