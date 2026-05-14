/**
 * Full-text search results page with pagination.
 *
 * @file Reads `q` from the query string and calls `fetchSearchAll`.
 * @imports react, react-router-dom, api, AnimeCard, UiState, SkeletonCard
 * @exports SearchPage component
 * @gotchas Empty queries render guidance instead of calling the API.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSearchAll } from '../lib/api';
import { AnimeCard } from '../components/AnimeCard.jsx';
import { UiState } from '../components/UiState.jsx';

/**
 * @returns {JSX.Element}
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [retryToken, setRetryToken] = useState(0);
  const q = useMemo(() => (params.get('q') || '').trim(), [params]);
  const page = useMemo(() => {
    const raw = Number(params.get('page') || '1');
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  }, [params]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) {
      setItems([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSearchAll(q, page)
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data?.AniData) ? data.AniData : []);
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
  }, [q, page, retryToken]);

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Results</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Query: <span className="text-zinc-300">{q}</span>
        </p>
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
              <div className="aspect-[2/3] rounded-xl bg-zinc-900" />
              <div className="h-4 rounded bg-zinc-900" />
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

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => goPage(page - 1)}
          className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-zinc-500">Page {page}</span>
        <button
          type="button"
          disabled={loading || items.length === 0}
          onClick={() => goPage(page + 1)}
          className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
