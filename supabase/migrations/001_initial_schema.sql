-- ============================================================
-- ZAWADI PLATFORM — DATABASE MIGRATION
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Uncomment if pgvector is available on your Supabase plan:
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ─── ENUMS ────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE content_type  AS ENUM ('movie', 'music', 'book');
  CREATE TYPE sub_tier      AS ENUM ('free', 'basic', 'premium');
  CREATE TYPE purchase_type AS ENUM ('buy', 'rent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── USERS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── CATEGORIES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  type       content_type NOT NULL,
  UNIQUE (slug, type)
);

-- ─── CONTENT ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  type             content_type NOT NULL,
  category_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description      TEXT,
  price            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  rent_price       NUMERIC(10, 2),
  stream_url       TEXT,
  thumbnail_url    TEXT,
  drm_key_id       TEXT,
  is_free          BOOLEAN NOT NULL DEFAULT FALSE,
  required_tier    sub_tier NOT NULL DEFAULT 'free',
  duration_seconds INTEGER,
  -- embedding     vector(1536),  -- Uncomment when pgvector is enabled
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier          sub_tier NOT NULL DEFAULT 'free',
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  stripe_sub_id TEXT,
  flutter_ref   TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ─── PURCHASES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.purchases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id      UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  type            purchase_type NOT NULL DEFAULT 'buy',
  amount_paid     NUMERIC(10, 2),
  currency        TEXT NOT NULL DEFAULT 'USD',
  payment_ref     TEXT,
  rent_expires_at TIMESTAMPTZ,
  purchased_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── REVIEWS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id  UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_id)
);

-- ─── WATCH HISTORY ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.watch_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id       UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  last_watched     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_id)
);

-- ─── DOWNLOADS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.downloads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content_id  UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  local_path  TEXT,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_type       ON public.content(type);
CREATE INDEX IF NOT EXISTS idx_content_category   ON public.content(category_id);
CREATE INDEX IF NOT EXISTS idx_content_is_free    ON public.content(is_free);
CREATE INDEX IF NOT EXISTS idx_content_tier       ON public.content(required_tier);
CREATE INDEX IF NOT EXISTS idx_watch_user         ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_content      ON public.watch_history(content_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user     ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_content  ON public.purchases(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_content    ON public.reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_subs_user          ON public.subscriptions(user_id);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads     ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- users
DROP POLICY IF EXISTS "users_read_own"   ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all"  ON public.users;
CREATE POLICY "users_read_own"   ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_admin_all"  ON public.users FOR ALL    USING (public.is_admin());

-- categories (public read, admin write)
DROP POLICY IF EXISTS "cats_public_read" ON public.categories;
DROP POLICY IF EXISTS "cats_admin_write" ON public.categories;
CREATE POLICY "cats_public_read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cats_admin_write" ON public.categories FOR ALL    USING (public.is_admin());

-- content: complex access
DROP POLICY IF EXISTS "content_read"       ON public.content;
DROP POLICY IF EXISTS "content_admin_all"  ON public.content;

CREATE POLICY "content_read" ON public.content FOR SELECT USING (
  is_free = TRUE
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND s.status  = 'active'
      AND (s.expires_at IS NULL OR s.expires_at > NOW())
      AND CASE required_tier
            WHEN 'free'    THEN TRUE
            WHEN 'basic'   THEN s.tier IN ('basic', 'premium')
            WHEN 'premium' THEN s.tier = 'premium'
          END
  )
  OR EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.user_id    = auth.uid()
      AND p.content_id = content.id
      AND (p.type = 'buy' OR p.rent_expires_at > NOW())
  )
);

CREATE POLICY "content_admin_all" ON public.content FOR ALL USING (public.is_admin());

-- subscriptions
DROP POLICY IF EXISTS "subs_own"       ON public.subscriptions;
DROP POLICY IF EXISTS "subs_admin_all" ON public.subscriptions;
CREATE POLICY "subs_own"       ON public.subscriptions FOR ALL USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "subs_admin_all" ON public.subscriptions FOR ALL USING (public.is_admin());

-- purchases
DROP POLICY IF EXISTS "purchases_own"       ON public.purchases;
DROP POLICY IF EXISTS "purchases_admin_all" ON public.purchases;
CREATE POLICY "purchases_own"       ON public.purchases FOR ALL USING (user_id = auth.uid());
CREATE POLICY "purchases_admin_all" ON public.purchases FOR ALL USING (public.is_admin());

-- reviews
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_own_write"   ON public.reviews;
DROP POLICY IF EXISTS "reviews_own_delete"  ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT  USING (true);
CREATE POLICY "reviews_own_write"   ON public.reviews FOR INSERT  WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_own_update"  ON public.reviews FOR UPDATE  USING (user_id = auth.uid());
CREATE POLICY "reviews_own_delete"  ON public.reviews FOR DELETE  USING (user_id = auth.uid() OR public.is_admin());

-- watch_history
DROP POLICY IF EXISTS "history_own"       ON public.watch_history;
DROP POLICY IF EXISTS "history_admin_all" ON public.watch_history;
CREATE POLICY "history_own"       ON public.watch_history FOR ALL USING (user_id = auth.uid());
CREATE POLICY "history_admin_all" ON public.watch_history FOR ALL USING (public.is_admin());

-- downloads
DROP POLICY IF EXISTS "downloads_own" ON public.downloads;
CREATE POLICY "downloads_own" ON public.downloads FOR ALL USING (user_id = auth.uid());

-- ─── SEED DATA ────────────────────────────────────────────────────────
-- Categories
INSERT INTO public.categories (name, slug, type) VALUES
  ('Action',       'action',       'movie'),
  ('Drama',        'drama',        'movie'),
  ('Comedy',       'comedy',       'movie'),
  ('Nollywood',    'nollywood',    'movie'),
  ('Documentary',  'documentary',  'movie'),
  ('Afrobeats',    'afrobeats',    'music'),
  ('Bongo Flava',  'bongo-flava',  'music'),
  ('Highlife',     'highlife',     'music'),
  ('Gospel',       'gospel',       'music'),
  ('Hip Hop',      'hiphop',       'music'),
  ('Fiction',      'fiction',      'book'),
  ('Non-Fiction',  'non-fiction',  'book'),
  ('African Lit',  'african-lit',  'book'),
  ('Business',     'business',     'book'),
  ('Self Help',    'self-help',    'book')
ON CONFLICT (slug, type) DO NOTHING;

-- Sample content (free tier, using placeholder stream URLs)
WITH cats AS (SELECT id, slug FROM public.categories)
INSERT INTO public.content (title, type, category_id, description, price, is_free, required_tier, duration_seconds, thumbnail_url, stream_url)
SELECT v.title, v.type::content_type, cats.id, v.description, v.price, v.is_free, v.tier::sub_tier, v.dur, v.thumb, v.stream
FROM (VALUES
  -- Movies
  ('The Last Warrior',   'movie', 'nollywood',  'A warrior fights to save his kingdom from colonial forces.',          0,    true,  'free',    7200, null, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'),
  ('Lagos by Night',     'movie', 'drama',      'A gripping drama set in the heart of Lagos.',                         4.99, false, 'basic',   5400, null, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'),
  ('Savanna Rising',     'movie', 'action',     'An elite soldier uncovers a conspiracy in the Nairobi underworld.',   3.99, false, 'premium', 6300, null, null),
  ('Mama Africa',        'movie', 'documentary','The untold story of Africa''s most inspiring women.',                  0,    true,  'free',    3600, null, 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'),
  ('The Joker''s Game',  'movie', 'comedy',     'A hilarious comedy about life in Accra.',                             2.99, false, 'basic',   5100, null, null),
  -- Music
  ('Afrowave Vol. 1',    'music', 'afrobeats',  'The best of Afrobeats — curated.',                                    1.99, true,  'free',    2400, null, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'),
  ('Bongo Mix 2024',     'music', 'bongo-flava', 'Fresh Bongo Flava straight from Dar es Salaam.',                    1.99, true,  'free',    3000, null, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'),
  ('Sunday Gospel',      'music', 'gospel',     'Uplifting gospel for the spirit.',                                    0,    true,  'free',    2700, null, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'),
  ('Nairobi Nights EP',  'music', 'afrobeats',  'Afro-fusion beats from the city of Nairobi.',                         2.99, false, 'basic',   1800, null, null),
  ('Highlife Gold',      'music', 'highlife',   'Classic Highlife from Ghana — remastered.',                           1.49, false, 'free',    3600, null, null),
  -- Books
  ('Things Fall Apart',  'book',  'african-lit','Chinua Achebe''s timeless masterpiece.',                               0,    true,  'free',    null, null, null),
  ('The Kite Runner',    'book',  'fiction',    'A powerful story of friendship and redemption.',                       3.99, false, 'basic',   null, null, null),
  ('Africa Rising',      'book',  'non-fiction','How Africa is rewriting global economic history.',                     4.99, false, 'premium', null, null, null),
  ('Purple Hibiscus',    'book',  'african-lit','Chimamanda Ngozi Adichie''s debut novel.',                             2.99, false, 'basic',   null, null, null),
  ('Build to Last',      'book',  'business',   'Business lessons for African entrepreneurs.',                          0,    true,  'free',    null, null, null)
) AS v(title, type, slug, description, price, is_free, tier, dur, thumb, stream)
JOIN cats ON cats.slug = v.slug
ON CONFLICT DO NOTHING;

-- ─── CONTENT REQUESTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.content_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        content_type NOT NULL,
  description TEXT,
  category    TEXT,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'in_progress')),
  admin_reply TEXT,
  upvotes     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── REQUEST UPVOTES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.request_upvotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id  UUID NOT NULL REFERENCES public.content_requests(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, request_id)
);

-- ─── INDEXES FOR REQUESTS ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_requests_user     ON public.content_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_status   ON public.content_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type     ON public.content_requests(type);
CREATE INDEX IF NOT EXISTS idx_upvotes_request   ON public.request_upvotes(request_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user      ON public.request_upvotes(user_id);

-- ─── ROW LEVEL SECURITY FOR REQUESTS ──────────────────────────────────
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_upvotes  ENABLE ROW LEVEL SECURITY;

-- content_requests policies
DROP POLICY IF EXISTS "requests_public_read" ON public.content_requests;
DROP POLICY IF EXISTS "requests_own_write"   ON public.content_requests;
DROP POLICY IF EXISTS "requests_own_update"  ON public.content_requests;
DROP POLICY IF EXISTS "requests_admin_all"   ON public.content_requests;
CREATE POLICY "requests_public_read" ON public.content_requests FOR SELECT  USING (true);
CREATE POLICY "requests_own_write"   ON public.content_requests FOR INSERT  WITH CHECK (user_id = auth.uid());
CREATE POLICY "requests_own_update"  ON public.content_requests FOR UPDATE  USING (user_id = auth.uid());
CREATE POLICY "requests_admin_all"   ON public.content_requests FOR ALL     USING (public.is_admin());

-- request_upvotes policies
DROP POLICY IF EXISTS "upvotes_own" ON public.request_upvotes;
CREATE POLICY "upvotes_own" ON public.request_upvotes FOR ALL USING (user_id = auth.uid());
