
# Zawadi
=======
# Zawadi 🎬🎵📚

> **Africa's Stories, On Africa's Terms.**
> A full-stack streaming platform for movies, music, and books — built for African users.

![Tech Stack](https://img.shields.io/badge/Next.js-14-black) ![Supabase](https://img.shields.io/badge/Supabase-green) ![TypeScript](https://img.shields.io/badge/TypeScript-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4)

---

## ✨ Features

| Feature | Status |
|---|---|
| Movie streaming (HLS/Mux) | ✅ |
| Music player (persistent bar) | ✅ |
| Book reader (epub.js + PDF.js) | ✅ |
| Email + Google Auth (Supabase) | ✅ |
| Subscription tiers (Free/Basic/Premium) | ✅ |
| Pay-per-view & rentals | ✅ |
| Stripe payments | ✅ |
| Flutterwave (M-Pesa, MTN MoMo, OPay) | ✅ |
| Row-Level Security (RLS) | ✅ |
| Admin dashboard + content upload | ✅ |
| Revenue + watch analytics | ✅ |
| Ratings & reviews | ✅ |
| Continue watching | ✅ |
| Offline service worker | ✅ |
| Dark mode (default) | ✅ |
| Mobile-first responsive UI | ✅ |

---

## 🏗 Tech Stack

```
Frontend    Next.js 14 (App Router) + React 18
Styling     Tailwind CSS + custom design system
State       Zustand
Backend     Supabase (PostgreSQL, Auth, Storage, Edge Functions)
Video       Mux (HLS adaptive streaming + DRM)
Audio/Books Cloudflare R2 + CDN
Payments    Stripe (international) + Flutterwave (Africa)
Analytics   Recharts (built-in) + optional PostHog
Deploy      Vercel (frontend) + Supabase (backend)
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-org/zawadi.git
cd zawadi/apps/web
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy `Project URL` and `anon key` from **Settings → API**
3. Copy `service_role key` (keep secret!)

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in all values — see .env.example for details
```

Minimum required for local dev:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run the database migration

In your Supabase project → **SQL Editor** → paste the entire contents of:
```
supabase/migrations/001_initial_schema.sql
```
This creates all tables, RLS policies, triggers, indexes, and seed data.

### 5. Enable Google Auth (optional)

1. Supabase Dashboard → **Auth → Providers → Google**
2. Add your Google OAuth credentials
3. Set redirect URL to `http://localhost:3000/auth/callback`

### 6. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 7. Create an admin user

After registering, run this SQL to promote your account:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
```
Then visit `/admin` to access the dashboard.

---

## 📁 Project Structure

```
zawadi/
├── apps/web/                    # Next.js frontend
│   ├── app/
│   │   ├── (auth)/             # Login / Register
│   │   ├── (main)/             # Main app (Navbar + AudioBar)
│   │   │   ├── page.tsx        # Home / Hero
│   │   │   ├── browse/         # Movies, Music, Books
│   │   │   ├── watch/[id]/     # Video player
│   │   │   ├── listen/[id]/    # Audio (triggers bottom bar)
│   │   │   ├── read/[id]/      # epub.js book reader
│   │   │   ├── library/        # User library
│   │   │   └── profile/        # Profile + subscriptions
│   │   ├── admin/              # Admin dashboard
│   │   ├── api/webhooks/       # Stripe + Flutterwave webhooks
│   │   └── auth/callback/      # OAuth redirect
│   ├── components/
│   │   ├── content/            # Cards, rows, hero, access gate
│   │   ├── player/             # VideoPlayer, AudioPlayerBar, BookReader
│   │   ├── admin/              # Charts, UploadForm
│   │   ├── layout/             # Navbar, Skeleton
│   │   └── ui/                 # Toaster
│   ├── lib/
│   │   ├── supabase/           # client.ts, server.ts
│   │   └── stores/             # useAuthStore, usePlayerStore
│   └── public/sw.js            # Service worker
└── supabase/
    ├── functions/              # Edge Functions (Deno)
    │   ├── validate-access/
    │   ├── create-checkout/
    │   └── signed-url/
    └── migrations/
        └── 001_initial_schema.sql
```

---

## 🌍 Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → paste from .env.local
```

### Supabase Edge Functions

```bash
# Install Supabase CLI
npm i -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy validate-access
supabase functions deploy create-checkout
supabase functions deploy signed-url

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set FLW_SECRET_KEY=FLWSECK-...
supabase secrets set SITE_URL=https://zawadi.africa
```

### Stripe Webhooks

1. Stripe Dashboard → **Webhooks → Add endpoint**
2. URL: `https://zawadi.africa/api/webhooks/stripe`
3. Events to listen: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy `Signing secret` → add as `STRIPE_WEBHOOK_SECRET`

### Flutterwave Webhooks

1. Flutterwave Dashboard → **Settings → Webhooks**
2. URL: `https://zawadi.africa/api/webhooks/flutterwave`
3. Hash: set `FLW_SECRET_HASH` in your env

---

## 🎬 Adding Content (Admin)

1. Sign in as admin → `/admin/content`
2. Click **"Add New Content"**
3. Fill in title, type (movie/music/book), category, pricing, stream URL
4. For video: upload to **Mux** first, copy the Playback ID as stream URL
5. For audio/books: upload to **Supabase Storage** or **Cloudflare R2**

---

## 💳 Payment Flow

```
User clicks "Buy" / "Subscribe"
       ↓
create-checkout Edge Function
       ↓
  Africa? → Flutterwave hosted checkout
  Global? → Stripe Checkout
       ↓
Payment succeeds → Webhook fired
       ↓
Supabase: purchases or subscriptions table updated
       ↓
User gains content access (RLS policies)
```

---

## 🔒 Content Access Logic

```
is_free = TRUE         → Always accessible
is_free = FALSE:
  Check subscriptions  → active + correct tier
  OR
  Check purchases      → type='buy' OR rent not expired
  Neither              → Show AccessGate (upgrade/purchase prompt)
```

---

## 📊 Subscription Tiers

| Tier | Price | Access |
|---|---|---|
| Free | $0 | Free content only, ads |
| Basic | $4.99/mo | Most content, HD, no ads |
| Premium | $9.99/mo | All content, 4K, downloads |

Local pricing examples (Africa):
- Kenya: KES 599 / KES 999 per month
- Nigeria: NGN 2,500 / NGN 4,500 per month
- Uganda: UGX 18,000 / UGX 35,000 per month

---

## 🛣 Roadmap

- [ ] React Native mobile app (Expo)
- [ ] Live streaming (Mux Live)
- [ ] Creator upload portal
- [ ] Multi-language UI (Swahili, Yoruba, Amharic)
- [ ] AI recommendations (pgvector + embeddings)
- [ ] Watch parties (Supabase Realtime)
- [ ] M-Pesa STK Push direct integration
- [ ] Offline download with encrypted DRM

---

## 📄 License

MIT © Zawadi Platform

