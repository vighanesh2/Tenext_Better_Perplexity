# Better Perplexity

A [Next.js](https://nextjs.org) app with AI-powered search, research, and system design. Auth is handled with [Supabase](https://supabase.com) (email/password).

---

## Prerequisites

- **Node.js** 18+ and **npm** (or yarn/pnpm/bun)
- **Supabase** project (for sign-in/sign-up)
- **Groq** API key (for chat, intent, research, system design)
- **Tavily** API key (for web search / research)
- **Redis** (optional; used for caching; defaults to `redis://localhost:6379`)

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_ORG/Tenext_Better_Perplexity.git
cd Tenext_Better_Perplexity
npm install
```

### 2. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set at least:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `GROQ_API_KEY` | [Groq](https://console.groq.com) API key |
| `TAVILY_API_KEY` | [Tavily](https://tavily.com) API key |
| `REDIS_URL` | Optional; e.g. `redis://localhost:6379` |

**Supabase redirect URL:** In Supabase → **Authentication → URL Configuration**, add your app URL (e.g. `http://localhost:3000/auth/callback` for local dev).

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production build (optional)

```bash
npm run build
npm run start
```

---

## How to test / verify

- **Lint:**  
  ```bash
  npm run lint
  ```

- **Build (typecheck + build):**  
  ```bash
  npm run build
  ```
  Ensures the app compiles and has no type errors.

- **Manual smoke test:**  
  With `npm run dev` running, open [http://localhost:3000](http://localhost:3000), sign in or sign up, and try a query.  
  You can also hit the test API:  
  `GET /api/test?q=your+query&mode=intent` (or `mode=research`, `mode=system_design`).

---

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server at [http://localhost:3000](http://localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Run production server (run `build` first) |
| `npm run lint` | Run ESLint |

---

## Deploy on Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add the same environment variables in **Project → Settings → Environment Variables** (use the names from `.env.example`).
3. In **Project Settings → General → Root Directory** leave **empty** (or `.`) so the app is at the repo root.
4. Set **Framework Preset** to **Next.js** and deploy.

### If you see 404 after deploy

- **Root Directory** must be empty (or `.`), not a subfolder.
- **Framework Preset** should be **Next.js**.
- Do not set a custom **Output Directory**; use the Next.js default.
- Redeploy after changing these settings.

---

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
