ALTER TABLE user_schools ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
