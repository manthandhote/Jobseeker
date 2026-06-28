-- Run this in Supabase SQL Editor.
-- Adds fields that power the personalized application email.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline         TEXT,  -- e.g. "Software Developer"
  ADD COLUMN IF NOT EXISTS years_experience TEXT,  -- e.g. "3"
  ADD COLUMN IF NOT EXISTS key_skills       TEXT,  -- e.g. "React, Node.js, AWS"
  ADD COLUMN IF NOT EXISTS key_achievement  TEXT,  -- the measurable, stack-relevant achievement
  ADD COLUMN IF NOT EXISTS portfolio_url    TEXT;  -- GitHub / portfolio link
