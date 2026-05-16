/**
 * Home row for resuming recently watched anime.
 *
 * @file Fetches metadata for items in `localStorage` and renders a horizontal list.
 * @imports react, react-router-dom, api, lastWatched, SkeletonCard
 * @exports ContinueWatchingRow component
 * @gotchas
 * - **Concurrency:** Limits API fetches to 5 at a time to avoid rate limits.
 * - **Metadata:** Fetches title and poster for each anime ID since only ID/EP are stored.
 * - **Visibility:** Renders nothing if no history exists or all fetches fail.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAnimeDetails } from '../lib/api';
import { getAllWatchedHistory, removeWatchedHistory } from '../lib/lastWatched';
import { SkeletonCard } from './SkeletonCard.jsx';

/**
 * Processes items with a concurrency limit.
 *
 * @template T, R
 * @param {T[]} items
 * @param {(item: T) => Promise<R>} fn
 * @param {number} limit
 * @returns {Promise<Array<R | null>>}
 */
async function mapLimit(items, fn, limit) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const res = await Promise.allSettled(batch.map(fn));
    results.push(...res.map((r) => (r.status === 'fulfilled' ? r.value : null)));
  }
  return results;
}

/**
 * @returns {JSX.Element | null}
 */
export function ContinueWatchingRow() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadMetadata = useCallback(async (rawHistory) => {
    setLoading(true);
    // Max 10 entries
    const subset = rawHistory.slice(0, 10);
    
    const results = await mapLimit(
      subset,
      async (h) => {
        try {
          const detail = await getAnimeDetails(h.animeId);
          if (!detail?.local) return null;
          return {
            ...h,
            title: detail.local.Name || detail.local.name || 'Unknown',
            image: detail.local.ImagePath || detail.local.Cover || detail.local.Image,
          };
        } catch {
          return null;
        }
      },
      5
    );

    setItems(results.filter(Boolean));
    setLoading(false);
  }, []);

  useEffect(() => {
    const raw = getAllWatchedHistory();
    // No history -> silent exit
    if (raw.length === 0) {
      setLoading(false);
      return;
    }
    setHistory(raw);
    loadMetadata(raw);
  }, [loadMetadata]);

  const onRemove = (e, animeId) => {
    e.preventDefault();
    e.stopPropagation();
    removeWatchedHistory(animeId);
    const updated = items.filter((it) => it.animeId !== animeId);
    setItems(updated);
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Continue Watching</h2>
          <p className="text-sm text-zinc-500">Pick up where you left off</p>
        </div>
      </div>

      {loading ? (
        <SkeletonCard count={Math.min(history.length || 5, 10)} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-2 sm:scrollbar-thin sm:snap-x sm:snap-mandatory">
          {items.map((item) => (
            <article 
              key={item.animeId} 
              className="group relative w-full shrink-0 sm:w-[170px] h-auto sm:h-[330px] sm:snap-start"
            >
              <Link
                to={`/watch/${item.animeId}/${item.episode}`}
                className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-xl"
              >
                <div className="relative flex-1 overflow-hidden rounded-t-xl border border-b-0 border-surface-border bg-surface-raised shadow-card transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.02]">
                  <div className="aspect-[2/3] w-full bg-zinc-900 sm:h-full">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        No art
                      </div>
                    )}
                  </div>
                  
                  {/* EP Badge */}
                  <div className="absolute bottom-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    EP {item.episode}
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => onRemove(e, item.animeId)}
                    aria-label={`Remove ${item.title} from history`}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-rose-600 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex flex-shrink-0 flex-items-center rounded-b-xl border border-t-0 border-surface-border bg-surface-raised px-4 py-2.5 h-[52px] sm:h-[60px]">
                  <p className="line-clamp-2 text-xs sm:text-sm font-medium leading-snug text-zinc-100">
                    {item.title}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
