-- ============================================================
-- JobSeeker Pro — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  linkedin_url TEXT,
  summary     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resumes
CREATE TABLE IF NOT EXISTS public.resumes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  file_name   TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Experiences
CREATE TABLE IF NOT EXISTS public.experiences (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  company     TEXT NOT NULL,
  role        TEXT NOT NULL,
  start_date  DATE,
  end_date    DATE,
  is_current  BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Educations
CREATE TABLE IF NOT EXISTS public.educations (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  institution    TEXT NOT NULL,
  degree         TEXT NOT NULL,
  field_of_study TEXT,
  start_year     INT,
  end_year       INT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Job Postings (from OCR extractions)
CREATE TABLE IF NOT EXISTS public.job_postings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  image_url    TEXT,
  raw_text     TEXT,
  company_name TEXT,
  job_title    TEXT,
  emails       TEXT[] DEFAULT '{}',
  phones       TEXT[] DEFAULT '{}',
  location     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Call Todos
CREATE TABLE IF NOT EXISTS public.call_todos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  job_posting_id  UUID REFERENCES public.job_postings (id) ON DELETE SET NULL,
  phone           TEXT NOT NULL,
  recruiter_name  TEXT,
  company_name    TEXT,
  notes           TEXT,
  is_done         BOOLEAN DEFAULT FALSE,
  called_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Email Logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  job_posting_id  UUID REFERENCES public.job_postings (id) ON DELETE SET NULL,
  to_email        TEXT NOT NULL,
  subject         TEXT,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT DEFAULT 'sent'
);

-- ── Row-Level Security ──────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_todos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs   ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Resumes
CREATE POLICY "Users manage own resumes" ON public.resumes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Experiences
CREATE POLICY "Users manage own experiences" ON public.experiences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Educations
CREATE POLICY "Users manage own educations" ON public.educations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Job Postings
CREATE POLICY "Users manage own job_postings" ON public.job_postings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Call Todos
CREATE POLICY "Users manage own call_todos" ON public.call_todos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Email Logs
CREATE POLICY "Users manage own email_logs" ON public.email_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Storage Buckets ─────────────────────────────────────────
-- Run these separately in the Storage section or via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-screenshots', 'job-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users manage own resumes storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users manage own screenshots storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'job-screenshots' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'job-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
