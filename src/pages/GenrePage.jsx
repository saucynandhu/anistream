/**
 * Paginated genre grid page (`/genre/:genre?page=`).
 *
 * @file Maps `wholePage` items into cards; uses lowercase `page` query for API compatibility.
 * @imports react, react-router-dom, api, AnimeCard, UiState
 * @exports GenrePage component
 * @gotchas Genre label is URL-encoded in the path segment.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchByGenre } from '../lib/api';
import { AnimeCard } from '../components/AnimeCard.jsx';
import { UiState } from '../components/UiState.jsx';

/**
 * @returns {JSX.Element}
 */
export function GenrePage() {
  const { genre } = useParams();
  const [params, setParams] = useSearchParams();
  const [retryToken, setRetryToken] = useState(0);

  const decoded = useMemo(() => decodeURIComponent(genre || ''), [genre]);
  const page = useMemo(() => {
    const raw = Number(params.get('page') || '1');
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
  }, [params]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!decoded) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchByGenre(decoded, page)
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data?.wholePage) ? data.wholePage : []);
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
  }, [decoded, page, retryToken]);

  function goPage(next) {
    const p = new URLSearchParams(params);
    p.set('page', String(next));
    setParams(p, { replace: false });
  }

  if (!decoded) {
    return <UiState title="Missing genre" description="This URL is incomplete." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{decoded}</h1>
          <p className="text-sm text-zinc-500">Page {page}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => goPage(page - 1)}
            className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40"
          >
            Previous
          </button>
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

      {error ? (
        <UiState title="Couldn’t load genre" description="The API may be busy." onRetry={() => setRetryToken((t) => t + 1)} />
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
        <UiState title="No titles found" description="Try another genre or page." />
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
    </div>
  );
}
