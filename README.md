# AniStream

AniStream is a **dark, minimal anime discovery + streaming SPA** built with **React (Vite)**, **React Router v6**, **Tailwind CSS**, and **Zustand** (watchlist + lightweight player context). Catalog and streaming **metadata** requests use a configurable base URL that defaults to **`/anipub-api`** so the browser stays **same-origin** during development.

## CORS and the Vite proxy

Direct `fetch('https://anipub.xyz/...')` from `http://localhost:5173` is cross-origin. If the upstream response omits `Access-Control-Allow-Origin` (especially on errors), the browser blocks the response. This project avoids that in **dev** and **`vite preview`** by proxying:

- Browser → `GET /anipub-api/api/...` (same origin as the Vite server)
- Vite → `https://anipub.xyz/api/...` (server-side; no browser CORS)

See `vite.config.js` (`server.proxy` and `preview.proxy`).

**Production (generic static host):** `npm run build` is static only — there is **no** Vite proxy in `dist`. Either set **`VITE_API_BASE`** to your own reverse-proxy URL or deploy on **Vercel** using the included **`vercel.json`** (see **Deploy (GitHub + Vercel)** below). See `env.md`.

> **Docs vs reality:** Some docs cite `https://api.anipub.xyz`; that host has returned GitHub Pages 404s. The proxy target here is **`https://anipub.xyz`**.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

Optional: copy `.env.example` → `.env`. For local dev you usually **do not** need `VITE_API_BASE` (the `/anipub-api` default is correct).

## Deploy (GitHub + Vercel)

### 1. Push to GitHub

1. Create a **new public repository** on GitHub (empty is fine).
2. From this project folder:

```bash
git init
git add .
git commit -m "Initial commit: AniStream SPA"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Do **not** commit `.env` (it is listed in `.gitignore`). The catalog API used here does not require a client secret.

### 2. Import the repo in Vercel

1. Sign in at [vercel.com](https://vercel.com) → **Add New…** → **Project** → **Import** the GitHub repository.
2. **Framework Preset:** Vite (usually auto-detected).
3. **Build Command:** `npm run build` (default).
4. **Output Directory:** `dist` (default for Vite).
5. **Environment variables:** Optional. Leave blank to keep the default API base **`/anipub-api`**, which matches `vercel.json`.

### 3. What `vercel.json` does

- **`/anipub-api/:path*`** is rewritten to **`https://anipub.xyz/:path*`**, so the browser only talks to your deployment origin for JSON (no CORS from `anipub.xyz` on those fetches).
- **`/(.*)`** → **`/index.html`** enables React Router on hard refresh. Vercel still serves real files (for example under **`/assets/`**) when they exist on disk before applying that fallback.

After deploy, open DevTools → Network and confirm API calls go to **`/anipub-api/...`** and return **200**.

### 4. CI on GitHub

Pushes and pull requests targeting **`main`** or **`master`** run **`npm ci`** and **`npm run build`** (`.github/workflows/ci.yml`).

**In-app dev notes:** The UI exposes **`/dev`** (linked from the footer) with a concise technical summary: stack, proxy, env, and known API quirks — useful when sharing the live site without opening the repo.

## Scripts

- `npm run dev` — Vite dev server (includes `/anipub-api` proxy)
- `npm run build` — production bundle (static assets only)
- `npm run preview` — serves `dist` **with the same `/anipub-api` proxy** for local production checks

## Folder structure

```
vercel.json         # Vercel: proxy /anipub-api → anipub.xyz + SPA fallback
LICENSE             # MIT — adjust copyright line if you prefer
.github/workflows/ci.yml
src/
  lib/
    api.js            # All HTTP endpoints + fixImage/stripSrc + episode helpers
    lastWatched.js    # localStorage helpers for resume playback
  store/
    useAppStore.js    # Zustand store (watchlist + player context)
  components/
    AnimeCard.jsx
    EpisodeList.jsx
    SearchBar.jsx
    GenrePills.jsx
    VideoPlayer.jsx
    SkeletonCard.jsx
    Layout.jsx
    SiteFooter.jsx
    UiState.jsx
  pages/
    Home.jsx
    AnimePage.jsx
    WatchPage.jsx
    SearchPage.jsx
    GenrePage.jsx
    DevNotesPage.jsx
  router.jsx          # createBrowserRouter route table
  main.jsx            # React bootstrap + RouterProvider
  index.css           # Tailwind entry + small global polish
```

## API overview (used endpoints)

Base URL is `getApiBase()` → `import.meta.env.VITE_API_BASE` when set, otherwise **`/anipub-api`** (proxied in dev/preview).

| Feature | Method | Path |
| --- | --- | --- |
| Top rated (paginated) | GET | `/api/findbyrating?page=` |
| Genre browse (paginated) | GET | `/api/findbyGenre/:genre?page=` |
| Search suggestions | GET | `/api/search/:name` |
| Search results | GET | `/api/searchall/:name?page=` |
| Anime details | GET | `/anime/api/details/:id` |
| Streaming links | GET | `/v1/api/details/:id` |

### Quirks / normalization

- **Images:** `fixImage()` (also exported as `resolveMediaUrl`) absolutizes relative paths using `https://anipub.xyz/`.
- **Streaming links:** Values look like `src=https://…`; `stripSrc()` removes the prefix (also available as `normalizeStreamingSrc`).
- **Episode mapping:** Episode **1** uses `local.link`. Episode **N≥2** uses `local.ep[N-2].link`.
- **Genre pagination:** Lowercase `?page=` is reliable; uppercase `?Page=` did not paginate correctly in testing.

## How streaming works

1. `WatchPage` loads streaming metadata (via the same proxied base).
2. It computes the iframe URL via `getStreamingIframeSrcForEpisode` (uses `stripSrc`).
3. `VideoPlayer` renders a full-width **16:9** iframe. The **stream URL itself** still points at the provider’s host (separate from fetch CORS).

### Referrer / embedding limitations

Some providers restrict iframe embedding (`X-Frame-Options`, CSP). That is independent of the API CORS fix; solving it may require a **dedicated embed/proxy strategy** on your infrastructure.

## Known limitations

- **Upstream data quality:** Some `characters[]` payloads can look inconsistent with the anime’s `local` metadata (API-side issue).
- **No accounts:** Watchlist is local-only (Zustand `persist`).
- **Legal:** This repository is a UI demo; you are responsible for complying with the laws and terms that apply to you, your users, and the upstream services.

## Dependencies (beyond React + Router + Tailwind)

- **`zustand`** — small global store for watchlist + “currently playing” without boilerplate.

## Public repository note

This UI loads metadata and embeds streams from **third-party services**. You are responsible for how you describe the project, comply with applicable law, and respect upstream terms. The **MIT license** applies to **this repository’s code only**, not to external media or APIs.

## Environment variables

See `env.md` for the authoritative list and examples.
