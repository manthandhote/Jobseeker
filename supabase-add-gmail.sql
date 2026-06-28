-- Run this in Supabase SQL Editor to add Gmail settings to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gmail_user TEXT,
  ADD COLUMN IF NOT EXISTS gmail_app_password TEXT;
