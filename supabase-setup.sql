-- ============================================================================
-- DEFENCE 24 BD — PostgreSQL & Supabase Row-Level Security (RLS) Setup Script
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  visual_key TEXT NOT NULL DEFAULT 'army_parade',
  custom_image_url TEXT,
  video_url TEXT,
  organization TEXT NOT NULL DEFAULT 'Defense Forces',
  is_lead_story BOOLEAN NOT NULL DEFAULT FALSE,
  is_secondary_feature BOOLEAN NOT NULL DEFAULT FALSE,
  is_breaking_ticker BOOLEAN NOT NULL DEFAULT TRUE,
  submitter_name TEXT,
  submitter_email TEXT,
  source_info TEXT,
  seo_meta_title_en TEXT,
  seo_meta_desc_en TEXT,
  seo_meta_desc_bn_title TEXT,
  seo_meta_desc_bn TEXT,
  payload_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.circulars (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  organization TEXT NOT NULL,
  deadline_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notices (
  id TEXT PRIMARY KEY,
  notice_type TEXT NOT NULL DEFAULT 'breaking',
  priority TEXT NOT NULL DEFAULT 'high',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  title_en TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  date_en TEXT NOT NULL,
  date_bn TEXT NOT NULL,
  linked_article_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id SERIAL PRIMARY KEY,
  actor_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  details_en TEXT NOT NULL,
  details_bn TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public visitors can ONLY read published news
CREATE POLICY "Public visitors read published articles"
  ON public.articles
  FOR SELECT
  USING (status = 'published');

-- Policy 2: Public visitors can submit news strictly as 'pending'
CREATE POLICY "Public visitors insert pending submissions"
  ON public.articles
  FOR INSERT
  WITH CHECK (status = 'pending');

-- Policy 3: Only authorized Admins can update, approve, or delete articles
CREATE POLICY "Authorized admins full control on articles"
  ON public.articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.uid = current_setting('request.jwt.claim.sub', true)
      AND users.role IN ('admin', 'editor')
    )
  );
