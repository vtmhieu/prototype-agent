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
4. Find your keys — go to **Project Settings → API**:

   ![Supabase API settings](https://i.imgur.com/placeholder.png)

   | What you need | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** field |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys → anon public** field |

### 2. GitHub OAuth app

1. Go to **github.com/settings/developers → OAuth Apps → New OAuth App**
2. Fill in:
   - **Application name:** Prototype Agent
   - **Homepage URL:** `https://your-app.vercel.app`
   - **Authorization callback URL:** `https://your-app.vercel.app/auth/callback`
3. Copy the **Client ID** and generate a **Client Secret**
4. In Supabase → **Authentication → Providers → GitHub** → enable it, paste Client ID and Secret
5. In Supabase → **Authentication → URL Configuration** → add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**

### 3. Gemini API key

1. Go to **aistudio.google.com** → Get API key → **Create API key in new project**
2. No credit card needed — free tier

### 4. Add environment variables to Vercel

> ⚠️ This is the most important step. If these are missing or wrong, the app won't work.

Go to **vercel.com → your project → Settings → Environment Variables** and add all four:

| Variable | Where to get it | Example value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public | `eyJhbGci...` (long string) |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key | `AIzaSy...` |
| `GEMINI_MODEL` | Type it manually | `gemini-2.0-flash-lite` |

After adding all variables, **redeploy** — Vercel must rebuild for `NEXT_PUBLIC_` variables to take effect:
- Go to **Deployments → latest deployment → ⋯ → Redeploy**
- Or push any commit to trigger a new build

### 5. Local development

```bash
cp .env.example .env.local
# Fill in the values (same 4 variables as above)
npm install
npm run dev
```

---

## Design

- **Landing page** — dark hero with violet gradient glow, large headline, fake demo window, 3-column feature grid
- **Dashboard** — white cards with per-prototype colour avatars, violet accent, sticky header, rich empty state
- **Editor** — split-pane with live iframe, AI chat sidebar, collapsible on mobile
- **Font** — Inter via `next/font/google`

---

## Usage

1. Visit your app URL → **Continue with GitHub**
2. Type what you want to build (title + optional details)
3. Click **Generate Prototype** — takes ~15–30 seconds
4. Click **Open prototype →** to view it in a new tab (only you can access it)
5. Click **Edit** on any prototype to open the AI chat sidebar editor:
   - Live preview on the left (updates instantly — no page reload)
   - Describe any change in the chat on the right (e.g. "add dark mode", "change the table to show 10 rows")
   - Changes **auto-save 3 seconds** after each patch — no manual save needed
   - Browser warns you before closing if there are unsaved changes
   - **Download** button exports the HTML file locally
   - On mobile, the sidebar collapses — tap the chat icon to toggle it
6. Click **Copy link** to copy the prototype URL to your clipboard
7. Click **Regenerate** to re-run the original AI generation with a new request
8. Click **Delete** to remove it permanently

---

## Privacy model

- **Auth:** GitHub OAuth via Supabase — users are identified by their GitHub account
- **Database:** Supabase Row Level Security — every query is filtered to `auth.uid() = user_id`
- **Storage:** Private bucket with RLS — files stored at `{user_id}/{prototype_id}/index.html`
- **Serving:** `/prototype/[id]` checks session + ownership before returning HTML
- **No shared URLs:** prototype URLs only work when you're logged in as the owner

---

## Troubleshooting

**"No API key found in request"**
→ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing or the app hasn't been redeployed since you added it. Redeploy from the Vercel dashboard.

**"Invalid login credentials" / OAuth not working**
→ Check that the callback URL in your GitHub OAuth App matches exactly: `https://your-app.vercel.app/auth/callback`. Also check Supabase → Authentication → URL Configuration has the same URL in Redirect URLs.

**Generation/patch shows a specific error message**
→ The app now surfaces the real Gemini error. Common causes: quota exceeded on the free tier (wait a minute), or model not available in your region.

**Build fails**
→ Check Vercel → Deployments → the failed build → Build Logs for the specific error.

---

## Customize

### Use a smarter model

Change `GEMINI_MODEL` in Vercel → Settings → Environment Variables:
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
│   ├── page.tsx                        # Landing / login
│   ├── dashboard/page.tsx              # Main portal (auth-gated)
│   ├── prototype/[id]/route.ts         # Serves HTML (auth-gated, owner only)
│   ├── prototype/[id]/edit/page.tsx    # AI chat sidebar editor
│   ├── auth/callback/route.ts          # OAuth callback
│   └── api/
│       ├── generate/route.ts           # POST: new prototype
│       ├── update/route.ts             # POST: regenerate existing
│       ├── patch/route.ts              # POST: AI chat edit (returns new HTML)
│       ├── save/route.ts               # POST: persist edited HTML to storage
│       └── delete/[id]/route.ts        # DELETE: remove
├── components/
│   ├── Dashboard.tsx                   # Main UI (client component)
│   ├── Editor.tsx                      # Split-pane AI editor (client component)
│   └── LoginButton.tsx
├── lib/
│   ├── supabase/server.ts              # Server-side Supabase client
│   ├── supabase/client.ts              # Browser Supabase client
│   ├── gemini.ts                       # Gemini generation + patch logic
│   └── types.ts
├── middleware.ts                       # Auth protection on all routes
├── supabase/schema.sql                 # DB + storage RLS (run once)
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
