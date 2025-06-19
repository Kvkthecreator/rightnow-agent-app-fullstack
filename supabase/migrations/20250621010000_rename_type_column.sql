-- Rename old column if present
ALTER TABLE blocks RENAME COLUMN type TO semantic_type;
