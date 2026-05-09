# Prototype Agent

Multi-user web app — describe a UI in plain English, get a live interactive prototype in ~30 seconds. Each user's prototypes are completely private.

**Stack:** Next.js · Supabase (auth + db + storage) · Gemini · Vercel  
**Cost:** Free

---

## How it works

```
User logs in (GitHub or Google OAuth)
        ↓
Types a requirement → clicks Generate
        ↓
POST /api/generate (Vercel serverless, 60s limit)
  → Gemini generates plan + self-contained HTML
  → HTML uploaded to Supabase Storage (private, user-scoped path)
  → Metadata inserted to Supabase DB (Row Level Security enforced)
        ↓
User clicks "Open prototype →"
        ↓
GET /prototype/[id]
  → Session check + ownership check (RLS)
  → HTML served directly from storage
```

---

## Design

- **Landing page** — dark hero (`#0a0a0a`) with ambient violet glow, gradient headline, fake demo window, 3-column feature grid, compact nav sign-in
- **Dashboard** — same dark theme; AI-style prompt box with collapsible details, example prompt chips, 3-column prototype card grid, gradient top-bar avatars, time-ago dates
- **Editor** — split-pane with live `<iframe>`, AI chat sidebar, auto-save, download button, collapsible on mobile
- **Font** — Inter via `next/font/google`

---

## Setup (one time)

### 1. Supabase project

1. Go to **supabase.com** → New project (free tier)
2. **SQL Editor → New query** — paste `supabase/schema.sql` and run it
3. **Storage → New bucket**:
   - Name: `prototypes`
   - Public: **off** (private)
4. **Project Settings → API** — copy these two values:

   | Variable | Where to find it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL field |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project API keys → anon public |

### 2. OAuth providers

#### GitHub
1. **github.com/settings/developers → OAuth Apps → New OAuth App**
2. Set **Authorization callback URL** to:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
3. Copy **Client ID** and **Client Secret**
4. Supabase → **Authentication → Providers → GitHub** → enable, paste credentials
5. Supabase → **Authentication → URL Configuration** → add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**, set **Site URL** to `https://your-app.vercel.app`

#### Google
1. **console.cloud.google.com** → APIs & Services → **Credentials → Create → OAuth client ID**
2. Application type: **Web application**
3. Add to **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
4. Copy **Client ID** and **Client Secret**
5. Supabase → **Authentication → Providers → Google** → enable, paste credentials

### 3. Gemini API key

1. Go to **aistudio.google.com** → Get API key → **Create API key in new project**
2. No credit card needed — free tier

### 4. Environment variables (Vercel)

> ⚠️ Must be set before deploying. `NEXT_PUBLIC_` vars require a redeploy to take effect.

Go to **vercel.com → your project → Settings → Environment Variables**:

| Variable | Where to get it | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | `eyJhbGci...` |
| `GEMINI_API_KEY` | aistudio.google.com | `AIzaSy...` |
| `GEMINI_MODEL` | Type manually | `gemini-2.0-flash-lite` |

After adding all variables, **redeploy**: Deployments → latest → ⋯ → Redeploy.

### 5. Local development

```bash
cp .env.example .env.local
# Fill in the 4 variables above
npm install
npm run dev
```

---

## Usage

1. Visit your app URL → sign in with **Google** or **GitHub**
2. Type what you want to build — click an example chip or write your own
3. Optionally expand **Add details** to describe features, layout, colours
4. Click **Generate** — takes ~15–30 seconds
5. Click **Open** to view the prototype in a new tab (only you can access it)
6. Click **Edit** to open the AI chat sidebar editor:
   - Live preview on the left updates instantly — no page reload
   - Describe changes in the chat (e.g. "add dark mode", "replace the table with a chart")
   - Changes **auto-save 3 seconds** after each patch
   - Browser warns before closing if there are unsaved changes
   - **Download** exports the HTML file locally
   - On mobile, the sidebar collapses — tap the chat icon to toggle it
7. Click **Copy link** to copy the prototype URL to your clipboard
8. Click **Regenerate** to re-run the AI with a new direction
9. Click **Delete** to remove permanently

---

## Privacy model

- **Auth:** GitHub / Google OAuth via Supabase — users identified by provider account
- **Database:** Row Level Security on every table — queries auto-filtered to `auth.uid() = user_id`
- **Storage:** Private bucket with RLS — files stored at `{user_id}/{prototype_id}/index.html`
- **Serving:** `/prototype/[id]` checks session + ownership before returning HTML
- **No shared URLs:** prototype URLs only work when logged in as the owner

---

## Troubleshooting

**"No API key found in request"**  
→ `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing or the app hasn't been redeployed since adding it.

**OAuth not working / redirect_uri mismatch**  
→ The callback URL in your GitHub/Google OAuth app must point to Supabase (`https://xxxx.supabase.co/auth/v1/callback`), not your Vercel URL. The Vercel URL goes in Supabase → URL Configuration.

**Generation shows a specific error message**  
→ The app surfaces the real Gemini error. Common causes: free-tier quota exceeded (wait a minute), or model unavailable in your region.

**Build fails**  
→ Check Vercel → Deployments → failed build → Build Logs.

---

## Customise

### Use a smarter model

Change `GEMINI_MODEL` in Vercel → Settings → Environment Variables:
- `gemini-2.0-flash` — better quality, still free
- `gemini-1.5-pro` — best quality, may need paid tier at volume

### Change the generation style

Edit `SYSTEM_PROMPT` in `lib/gemini.ts` to change the design aesthetic, allowed libraries, or output format.

### Add more OAuth providers

Enable any provider in Supabase → Authentication → Providers, then add a button in `components/LoginButton.tsx`.

---

## Project structure

```
prototype-agent/
├── app/
│   ├── page.tsx                        # Landing page (dark hero, sign-in)
│   ├── dashboard/page.tsx              # Dashboard (auth-gated)
│   ├── prototype/[id]/route.ts         # Serves HTML (auth-gated, owner only)
│   ├── prototype/[id]/edit/page.tsx    # AI chat sidebar editor
│   ├── auth/callback/route.ts          # OAuth callback (GitHub + Google)
│   └── api/
│       ├── generate/route.ts           # POST: new prototype
│       ├── update/route.ts             # POST: regenerate existing
│       ├── patch/route.ts              # POST: AI chat edit → returns new HTML
│       ├── save/route.ts               # POST: persist edited HTML to storage
│       └── delete/[id]/route.ts        # DELETE: remove prototype
├── components/
│   ├── Dashboard.tsx                   # Main UI — prompt box, card grid
│   ├── Editor.tsx                      # Split-pane AI editor
│   └── LoginButton.tsx                 # Google + GitHub OAuth buttons
├── lib/
│   ├── supabase/server.ts              # Server-side Supabase client
│   ├── supabase/client.ts              # Browser Supabase client
│   ├── gemini.ts                       # Gemini generation + patch logic
│   └── types.ts
├── middleware.ts                       # Auth protection on all routes
├── supabase/schema.sql                 # DB schema + RLS (run once)
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
