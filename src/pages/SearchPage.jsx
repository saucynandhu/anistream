/**
 * Full-text search results page with pagination and local fuzzy fallback.
 *
 * @file Reads `q` from the query string and calls `fetchSearchAll` with multi-query strategy.
 * @imports react, react-router-dom, api, AnimeCard, UiState, fuzzySearch, useAppStore
 * @exports SearchPage component
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSearchAll } from '../lib/api';
import { AnimeCard } from '../components/AnimeCard.jsx';
import { UiState } from '../components/UiState.jsx';
import { fuzzySearch } from '../lib/fuzzy';
import { useAppStore } from '../store/useAppStore';

/**
 * Cleans and normalizes queries to improve API hit rates.
 * @param {string} q
 * @returns {string[]}
 */
function getCandidateQueries(q) {
  const raw = q.trim().toLowerCase();
  if (!raw) return [];
  const candidates = new Set([raw]);

  // Strategy 2: Fix common double-letter typos (e.g. "attac" -> "attack" though simple strip is easier)
  // Simple normalization: strip double chars or fix common endings
  const normalized = raw.replace(/(.)\1+/g, '$1');
  if (normalized !== raw) candidates.add(normalized);

  // Strategy 3: Individual words
  const words = raw.split(/\s+/).filter(w => w.length > 3);
  words.forEach(w => candidates.add(w));

  return Array.from(candidates);
}

/**
 * @returns {JSX.Element}
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [retryToken, setRetryToken] = useState(0);
  const searchCache = useAppStore((s) => s.searchCache);

  const q = useMemo(() => (params.get('q') || '').trim(), [params]);
  const page = useMemo(() => {
    const raw = Number(params.get('page') || '1');
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  }, [params]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCacheOnly, setIsCacheOnly] = useState(false);

  useEffect(() => {
    if (!q) {
      setItems([]);
      setError(null);
      setLoading(false);
      setIsCacheOnly(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setIsCacheOnly(false);

    const candidates = getCandidateQueries(q);

    // Perform API search + Local cache search simultaneously
    const apiPromise = Promise.allSettled(
      candidates.map(query => fetchSearchAll(query, page))
    );

    apiPromise.then((results) => {
      if (cancelled) return;

      const apiRows = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (Array.isArray(r.value?.AniData) ? r.value.AniData : []));

      // Local Cache Fallback
      const cacheResults = fuzzySearch(searchCache, q);

      // Merge and Dedupe
      const merged = [...apiRows, ...cacheResults];
      const seen = new Set();
      const unique = merged.filter(item => {
        if (!item?._id || seen.has(item._id)) return false;
        seen.add(item._id);
        return true;
      });

      // Apply Fuse over the combined pool for final sorting
      const final = fuzzySearch(unique, q);
      
      setItems(final);
      setIsCacheOnly(apiRows.length === 0 && final.length > 0);
    })
    .catch((e) => {
      if (cancelled) return;
      setError(e);
      setItems([]);
    })
    .finally(() => {
      if (cancelled) return;
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [q, page, retryToken, searchCache]);

  function goPage(next) {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    if (q) p.set('q', q);
    setParams(p, { replace: false });
  }

  if (!q) {
    return (
      <UiState
        title="Search AniStream"
        description="Use the header search box and press Enter to see full results here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Results</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Query: <span className="text-zinc-300">{q}</span>
          </p>
        </div>
        {isCacheOnly && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs text-zinc-400">
             Showing results from local index — try the full spelling for more results
          </div>
        )}
      </div>

      {error ? (
        <UiState
          title="Search failed"
          description="Try again in a moment."
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-zinc-900 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-zinc-900 animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <UiState title="No matches" description="Try a shorter or alternate title spelling." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((a) => (
            <AnimeCard
              key={a._id}
              id={a._id}
              title={a.Name}
              image={a.ImagePath || a.Image}
              malScore={a.MALScore}
            />
          ))}
        </div>
      )}

      {!isCacheOnly && (
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => goPage(page - 1)}
            className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">Page {page}</span>
          <button
            type="button"
            disabled={loading || items.length === 0}
            onClick={() => goPage(page + 1)}
            className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
