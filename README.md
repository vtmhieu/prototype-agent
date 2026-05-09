# Prototype Agent

Multi-user web app — describe a UI, get a live private prototype in ~30 seconds. Each user only sees their own prototypes.

**Stack:** Next.js · Supabase (auth + db + storage) · Gemini · Vercel  
**Cost:** Free

---

## How it works

```
User logs in with GitHub
        ↓
Types a requirement → clicks Generate
        ↓
POST /api/generate (Vercel serverless, 60s limit)
  → Gemini generates plan + HTML (server-side, key never exposed)
  → HTML saved to Supabase Storage (private, user-scoped)
  → Metadata saved to Supabase DB (Row Level Security)
        ↓
User clicks "Open prototype →"
        ↓
GET /prototype/[id]
  → Auth check + ownership check (RLS)
  → HTML served directly from storage
```

---

## Setup (one time)

### 1. Supabase project

1. Go to **supabase.com** → New project (free tier)
2. Go to **SQL Editor → New query**, paste the contents of `supabase/schema.sql` and run it
3. Go to **Storage → New bucket**:
   - Name: `prototypes`
   - Public: **off** (private)
4. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. GitHub OAuth app

1. Go to **github.com/settings/developers → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** Prototype Agent
   - **Homepage URL:** `https://your-app.vercel.app`
   - **Authorization callback URL:** `https://your-app.vercel.app/auth/callback`
3. Copy the **Client ID** and generate a **Client Secret**
4. In Supabase → **Authentication → Providers → GitHub** → enable it, paste Client ID and Secret

### 3. Gemini API key

1. Go to **aistudio.google.com** → Get API key → Create API key in new project
2. No credit card needed — free tier

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Go to **vercel.com → New Project** → import the repo
3. Add these environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase project settings |
| `GEMINI_API_KEY` | From Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.0-flash-lite` (or leave unset) |

4. Deploy — Vercel gives you a URL like `your-app.vercel.app`
5. Go back to your GitHub OAuth App settings and update the homepage + callback URLs with your real Vercel URL
6. Go back to Supabase → **Authentication → URL Configuration** → add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**

### 5. Local development

```bash
cp .env.example .env.local
# Fill in the values
npm install
npm run dev
```

---

## Usage

1. Visit your app URL → **Continue with GitHub**
2. Type what you want to build (title + optional details)
3. Click **Generate Prototype** — takes ~15–30 seconds
4. Click **Open prototype →** to view it in a new tab (only you can access it)
5. Click **Update** on any prototype to iterate with a follow-up request
6. Click **Delete** to remove it permanently

---

## Privacy model

- **Auth:** GitHub OAuth via Supabase — users are identified by their GitHub account
- **Database:** Supabase Row Level Security — every query is filtered to `auth.uid() = user_id`
- **Storage:** Private bucket with RLS — files stored at `{user_id}/{prototype_id}/index.html`
- **Serving:** `/prototype/[id]` checks session + ownership before returning HTML
- **No shared URLs:** prototype URLs only work when you're logged in as the owner

---

## Customize

### Use a smarter model

Change `GEMINI_MODEL` in your Vercel environment variables:
- `gemini-2.0-flash` — better quality, still free
- `gemini-1.5-pro` — best quality, may need paid tier at volume

### Change the design style

Edit `SYSTEM_PROMPT` in `lib/gemini.ts`.

### Add more OAuth providers

Enable Google, Twitter, etc. in Supabase → Authentication → Providers. Add a button in `components/LoginButton.tsx`.

---

## Project structure

```
prototype-agent/
├── app/
│   ├── page.tsx                    # Landing / login
│   ├── dashboard/page.tsx          # Main portal (auth-gated)
│   ├── prototype/[id]/route.ts     # Serves HTML (auth-gated, owner only)
│   ├── auth/callback/route.ts      # OAuth callback
│   └── api/
│       ├── generate/route.ts       # POST: new prototype
│       ├── update/route.ts         # POST: update existing
│       └── delete/[id]/route.ts    # DELETE: remove
├── components/
│   ├── Dashboard.tsx               # Main UI (client component)
│   └── LoginButton.tsx
├── lib/
│   ├── supabase/server.ts          # Server-side Supabase client
│   ├── supabase/client.ts          # Browser Supabase client
│   ├── gemini.ts                   # Gemini generation logic
│   └── types.ts
├── middleware.ts                   # Auth protection on all routes
├── supabase/schema.sql             # DB + storage RLS (run once)
└── .env.example
```

---

## Cost at scale

| Users | Prototypes/month | Gemini | Vercel | Supabase |
|---|---|---|---|---|
| 50 | 500 | Free | Free | Free |
| 500 | 5,000 | ~$1–5 | Free | Free |
| 5,000 | 50,000 | ~$10–50 | Free | ~$25/mo |

---

## License

MIT
