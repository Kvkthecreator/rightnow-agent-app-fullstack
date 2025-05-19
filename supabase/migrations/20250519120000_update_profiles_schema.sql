-- V004__update_profiles_schema.sql
-- Migration: Update profiles table to match new schema

-- Remove deprecated columns
ALTER TABLE profiles
  DROP COLUMN IF EXISTS brand_name;
ALTER TABLE profiles
  DROP COLUMN IF EXISTS bio;
ALTER TABLE profiles
  DROP COLUMN IF EXISTS profile_image_url;
ALTER TABLE profiles
  DROP COLUMN IF EXISTS industry;
ALTER TABLE profiles
  DROP COLUMN IF EXISTS goals;
ALTER TABLE profiles
  DROP COLUMN IF EXISTS audience;

-- Add new schema columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS sns_handle TEXT,
  ADD COLUMN IF NOT EXISTS primary_sns_channel TEXT,
  ADD COLUMN IF NOT EXISTS platforms TEXT[],
  ADD COLUMN IF NOT EXISTS follower_count INTEGER,
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS audience_goal TEXT,
  ADD COLUMN IF NOT EXISTS monetization_goal TEXT,
  ADD COLUMN IF NOT EXISTS primary_objective TEXT,
  ADD COLUMN IF NOT EXISTS content_frequency TEXT,
  ADD COLUMN IF NOT EXISTS tone_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS favorite_brands TEXT[],
  ADD COLUMN IF NOT EXISTS prior_attempts TEXT,
  ADD COLUMN IF NOT EXISTS creative_barriers TEXT,
  ADD COLUMN IF NOT EXISTS locale TEXT;