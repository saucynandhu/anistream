# AniStream — Environment Variables

All variables are prefixed with `VITE_` so Vite exposes them to the browser bundle via `import.meta.env`.

Copy `.env.example` to `.env` and adjust values as needed.

---

## CORS note

The AniPub origin (`https://anipub.xyz`) may omit `Access-Control-Allow-Origin` on some error responses. Browsers then surface a **CORS** failure even when the upstream server answered.

**Mitigation in this repo**

- **Development + `vite preview`:** Requests default to **`/anipub-api`**, which Vite proxies server-side to `https://anipub.xyz` (see `vite.config.js`). The browser only talks to your dev/preview origin.
- **Static production (`dist` on plain hosting):** The Vite proxy is **not** present. Either set **`VITE_API_BASE`** to a URL your reverse proxy controls, or deploy on **Vercel** and rely on **`vercel.json`** in this repo (rewrites `/anipub-api` → `https://anipub.xyz`).

### Vercel (this repository)

If you deploy to Vercel with the included **`vercel.json`**, you normally **do not** set `VITE_API_BASE`. The app keeps using same-origin **`/anipub-api`**, and Vercel proxies those requests to `https://anipub.xyz` at the edge.

---

## Currently used variables

### `VITE_API_BASE`

| Field | Value |
| --- | --- |
| Required | **No** — defaults to `/anipub-api` (Vite proxy in dev / preview, or Vercel rewrite in production when using this repo’s `vercel.json`) |
| Example (production) | `https://api.yourdomain.com/anipub` or a same-origin path behind Nginx |
| Used in | `src/lib/api.js` → `getApiBase()` |

**What it does:** Base URL for all AniPub API fetches (no trailing slash). When unset, the app uses `/anipub-api` and logs a **one-time `console.info`** explaining that this is expected locally.

### `VITE_PROXY_URL` (legacy / unused)

| Field | Value |
| --- | --- |
| Required | No |
| Read by app | **No** — retained only in older notes; safe to omit |

---

## Not needed (public API)

| Variable | Why |
| --- | --- |
| `VITE_ANIPUB_API_KEY` | No authentication on these endpoints |
| `VITE_ANIPUB_TOKEN` | Same |

---

## Future / optional extensions

| Variable | Purpose |
| --- | --- |
| `VITE_ANALYTICS_ID` | Plausible / GA / Umami site id |
| `VITE_SENTRY_DSN` | Error reporting DSN |
| `VITE_FEATURE_*` | Feature flags |
