-- Update Volunteer (Relawan) Data Schema
-- This migration adds comprehensive profile columns to the 'users' table for strategic mapping.

ALTER TABLE "users" 
ADD COLUMN "nama" TEXT NOT NULL,
ADD COLUMN "nik_encrypted" TEXT NOT NULL,
ADD COLUMN "whatsapp" TEXT NOT NULL,
ADD COLUMN "tgl_lahir" DATE,
ADD COLUMN "alamat_ktp" TEXT,
ADD COLUMN "domisili" TEXT NOT NULL,
ADD COLUMN "koordinat_rumah" POINT, -- Using PostGIS Point or JSONB depending on DB
ADD COLUMN "pekerjaan" TEXT,
ADD COLUMN "ukuran_baju" TEXT CHECK (ukuran_baju IN ('S', 'M', 'L', 'XL', 'XXL')),
ADD COLUMN "tps_target" TEXT NOT NULL,
ADD COLUMN "sosmed_links" JSONB DEFAULT '{}',
ADD COLUMN "organisasi" TEXT;

-- Indexing for performance
CREATE INDEX idx_users_nik_encrypted ON "users" ("nik_encrypted");
CREATE INDEX idx_users_tps_target ON "users" ("tps_target");
CREATE INDEX idx_users_domisili ON "users" ("domisili");

-- Commenting on columns for clarity
COMMENT ON COLUMN "users"."nik_encrypted" IS 'PII: NIK is encrypted at rest using AES-256 or similar hashing/encryption.';
COMMENT ON COLUMN "users"."koordinat_rumah" IS 'Strategic Mapping: LatLong coordinates for volunteer home location.';
