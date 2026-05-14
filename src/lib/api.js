/**
 * Central API module for AniStream. All `fetch` calls for catalog/streaming go through this file.
 *
 * @file HTTP client + URL helpers for AniPub routes consumed by pages and header search.
 * @imports none (native `fetch` only)
 * @exports base resolver, image/streaming helpers, endpoint functions, episode utilities
 * @gotchas
 * - **CORS:** Direct browser calls to `https://anipub.xyz` can fail when upstream omits CORS headers on errors. Default base is **`/anipub-api`**, which Vite proxies server-side (see `vite.config.js`). Set `VITE_API_BASE` in production to your own reverse proxy.
 * - **Images:** Relative `ImagePath` / `Cover` / `Image` values are absolutized with `fixImage()` (CDN host `https://anipub.xyz/`).
 * - **Streaming:** Strip the `src=` prefix via `stripSrc()`. Episode 1 = `local.link`; episode N≥2 = `local.ep[N-2].link`.
 * - **Genre pagination:** This client uses lowercase `?page=` (reliable in testing). Some docs show `Page=`; that did not paginate correctly in prior checks.
 */

const LOG_PREFIX = '[AniStream]';

/**
 * Returns the base URL for all API paths (no trailing slash).
 *
 * Priority:
 * 1. `import.meta.env.VITE_API_BASE` when non-empty (production reverse proxy or custom dev URL)
 * 2. `/anipub-api` — same-origin path served by Vite's dev + preview proxy
 *
 * @returns {string}
 * @sideeffects One-time `console.info` when falling back to `/anipub-api`
 */
export function getApiBase() {
  const envBase = import.meta.env?.VITE_API_BASE;
  if (typeof envBase === 'string' && envBase.trim()) {
    return envBase.replace(/\/+$/, '');
  }
  if (!getApiBase._warned) {
    getApiBase._warned = true;
    // eslint-disable-next-line no-console
    console.info(
      `${LOG_PREFIX} VITE_API_BASE not set — using Vite proxy at /anipub-api. ` +
        'This works in development and `vite preview`. For static production hosting, set VITE_API_BASE to your reverse-proxy URL. See env.md.',
    );
  }
  return '/anipub-api';
}
getApiBase._warned = false;

/**
 * Ensures an image URL is absolute for `<img src>`.
 *
 * @param {string | null | undefined} path Raw path from API
 * @returns {string}
 */
export function fixImage(path) {
  if (!path || typeof path !== 'string') return '';
  const p = path.trim();
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return `https://anipub.xyz/${p.replace(/^\//, '')}`;
}

/**
 * Strips the `src=` prefix from a streaming link for iframe `src`.
 *
 * @param {string | null | undefined} link Raw link from `/v1/api/details`
 * @returns {string}
 */
export function stripSrc(link) {
  if (!link || typeof link !== 'string') return '';
  return link.replace(/^src=/i, '').trim();
}

/**
 * GET JSON helper with consistent errors.
 *
 * @param {string} path Absolute path beginning with `/` (e.g. `/api/findbyrating?page=1`)
 * @param {RequestInit} [options] Optional fetch options
 * @returns {Promise<any>}
 * @throws {Error} On non-OK HTTP status or network failure
 */
async function apiFetch(path, options = {}) {
  const base = getApiBase();
  const rel = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${rel}`;
  const { headers: optHeaders, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { Accept: 'application/json', ...(optHeaders || {}) },
  });
  if (!res.ok) {
    const err = new Error(`API error ${res.status} for ${rel}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * GET `/api/findbyrating?page=N`
 *
 * @param {number} [page=1]
 * @returns {Promise<{ currentPage: number, AniData: unknown[] }>}
 */
export async function getTopRated(page = 1) {
  return apiFetch(`/api/findbyrating?page=${encodeURIComponent(String(page))}`);
}

/**
 * GET `/api/findbyGenre/:genre?page=N` (lowercase `page` for reliable pagination)
 *
 * @param {string} genre
 * @param {number} [page=1]
 * @returns {Promise<{ currentPage: number, wholePage: unknown[] }>}
 */
export async function findByGenre(genre, page = 1) {
  return apiFetch(
    `/api/findbyGenre/${encodeURIComponent(genre)}?page=${encodeURIComponent(String(page))}`,
  );
}

/**
 * GET `/api/search/:name` — autocomplete-sized payload
 *
 * @param {string} query
 * @returns {Promise<Array<{ Name: string, Id: number, Image?: string, finder?: string }>>}
 */
export async function quickSearch(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const results = await apiFetch(`/api/search/${encodeURIComponent(q)}`);
  const rows = Array.isArray(results) ? results : [];
  return rows.map((r) => ({
    ...r,
    Image: fixImage(r.Image),
  }));
}

/**
 * GET `/api/searchall/:name?page=N`
 *
 * @param {string} query
 * @param {number} [page=1]
 * @returns {Promise<{ currentPage: number, AniData: unknown[] }>}
 */
export async function searchAll(query, page = 1) {
  const q = String(query || '').trim();
  if (!q) return { currentPage: 1, AniData: [] };
  return apiFetch(`/api/searchall/${encodeURIComponent(q)}?page=${encodeURIComponent(String(page))}`);
}

/**
 * GET `/anime/api/details/:id`
 *
 * @param {string | number} id
 * @returns {Promise<{ local: Record<string, unknown>, characters?: unknown[], jikan?: unknown }>}
 */
export async function getAnimeDetails(id) {
  const data = await apiFetch(`/anime/api/details/${encodeURIComponent(String(id))}`);
  if (data?.local) {
    data.local.ImagePath = fixImage(data.local.ImagePath);
    data.local.Cover = fixImage(data.local.Cover);
  }
  return data;
}

/**
 * GET `/v1/api/details/:id` — streaming links
 *
 * @param {string | number} id
 * @returns {Promise<{ local: { link?: string, ep?: Array<{ link?: string }>, name?: string, Name?: string, _id?: number } }>}
 */
export async function getStreamingLinks(id) {
  return apiFetch(`/v1/api/details/${encodeURIComponent(String(id))}`);
}

/**
 * GET `/api/getAll` — total catalog count (JSON number)
 *
 * @returns {Promise<number>}
 */
export async function getTotalCount() {
  return apiFetch('/api/getAll');
}

/**
 * GET `/api/find/:name`
 *
 * @param {string} name
 * @returns {Promise<unknown>}
 */
export async function findByName(name) {
  return apiFetch(`/api/find/${encodeURIComponent(name)}`);
}

/**
 * Builds ordered `{ episode, src }` entries from streaming payload.
 *
 * @param {{ local?: { link?: string, ep?: Array<{ link?: string }> } }} streamData
 * @returns {Array<{ episode: number, src: string }>}
 */
export function buildEpisodeList(streamData) {
  const local = streamData?.local;
  if (!local) return [];
  const episodes = [{ episode: 1, src: stripSrc(local.link) }];
  if (Array.isArray(local.ep)) {
    local.ep.forEach((ep, i) => {
      episodes.push({ episode: i + 2, src: stripSrc(ep?.link) });
    });
  }
  return episodes;
}

/**
 * iframe `src` for a 1-based episode index (AniPub mapping).
 *
 * @param {{ link?: string, ep?: Array<{ link?: string }> } | null | undefined} local
 * @param {number} episode
 * @returns {string}
 */
export function getStreamingIframeSrcForEpisode(local, episode) {
  if (!local || typeof episode !== 'number' || episode < 1) return '';
  if (episode === 1) return stripSrc(local.link);
  const idx = episode - 2;
  const ep = Array.isArray(local.ep) ? local.ep[idx] : undefined;
  return stripSrc(ep?.link);
}

/**
 * Counts playable episodes from streaming payload.
 *
 * @param {{ link?: string, ep?: unknown[] } | null | undefined} local
 * @returns {number}
 */
export function countStreamingEpisodes(local) {
  if (!local) return 0;
  const extras = Array.isArray(local.ep) ? local.ep.length : 0;
  const hasFirst = Boolean(stripSrc(local.link));
  return (hasFirst ? 1 : 0) + extras;
}

/** @deprecated Use {@link fixImage} — kept for older imports */
export const resolveMediaUrl = fixImage;

/** @deprecated Use {@link stripSrc} */
export const normalizeStreamingSrc = stripSrc;

/** @deprecated Use {@link getTopRated} */
export const fetchTopRated = getTopRated;

/** @deprecated Use {@link findByGenre} */
export const fetchByGenre = findByGenre;

/** @deprecated Use {@link quickSearch} */
export const fetchSearchSuggestions = quickSearch;

/** @deprecated Use {@link searchAll} */
export const fetchSearchAll = searchAll;

/** @deprecated Use {@link getAnimeDetails} */
export const fetchAnimeDetails = getAnimeDetails;

/** @deprecated Use {@link getStreamingLinks} */
export const fetchStreamingDetails = getStreamingLinks;
