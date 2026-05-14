/**
 * Home discovery page: hero, top-rated carousel, and optional genre row.
 *
 * @file Composes API calls for top-rated + genre browse and renders horizontal rows.
 * @imports react, react-router-dom, api, components
 * @exports Home page component
 * @gotchas Hero picks a random entry from the first loaded top-rated page (stable per mount).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchByGenre, fetchTopRated, resolveMediaUrl } from '../lib/api';
import { AnimeCard } from '../components/AnimeCard.jsx';
import { GenrePills } from '../components/GenrePills.jsx';
import { SkeletonCard } from '../components/SkeletonCard.jsx';
import { UiState } from '../components/UiState.jsx';

/**
 * Picks a random element from a non-empty array.
 *
 * @template T
 * @param {T[]} arr
 * @returns {T | null}
 */
function pickRandom(arr) {
  if (!arr.length) return null;
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] ?? null;
}

/**
 * Home route UI.
 *
 * @returns {JSX.Element}
 */
export function Home() {
  const [topRated, setTopRated] = useState([]);
  const [topPage, setTopPage] = useState(1);
  const [topLoading, setTopLoading] = useState(true);
  const [topError, setTopError] = useState(null);
  const [topHasMore, setTopHasMore] = useState(true);

  const [activeGenre, setActiveGenre] = useState(null);
  const [genreItems, setGenreItems] = useState([]);
  const [genrePage, setGenrePage] = useState(1);
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreError, setGenreError] = useState(null);
  const [genreHasMore, setGenreHasMore] = useState(false);

  const hero = useMemo(() => pickRandom(topRated.slice(0, 10)), [topRated]);

  const loadTop = useCallback(async (page, append) => {
    setTopLoading(true);
    setTopError(null);
    try {
      const data = await fetchTopRated(page);
      const rows = Array.isArray(data?.AniData) ? data.AniData : [];
      setTopRated((prev) => (append ? [...prev, ...rows] : rows));
      setTopPage(Number(data?.currentPage || page));
      setTopHasMore(rows.length > 0);
    } catch (e) {
      setTopError(e);
      if (!append) setTopRated([]);
    } finally {
      setTopLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTop(1, false);
  }, [loadTop]);

  const loadGenre = useCallback(async (genre, page, append) => {
    setGenreLoading(true);
    setGenreError(null);
    try {
      const data = await fetchByGenre(genre, page);
      const rows = Array.isArray(data?.wholePage) ? data.wholePage : [];
      setGenreItems((prev) => (append ? [...prev, ...rows] : rows));
      setGenrePage(Number(data?.currentPage || page));
      setGenreHasMore(rows.length > 0);
    } catch (e) {
      setGenreError(e);
      if (!append) setGenreItems([]);
    } finally {
      setGenreLoading(false);
    }
  }, []);

  /**
   * @param {string} genre
   */
  function onSelectGenre(genre) {
    setActiveGenre(genre);
    setGenreItems([]);
    setGenrePage(1);
    loadGenre(genre, 1, false);
  }

  const heroImg = hero
    ? resolveMediaUrl(hero.ImagePath || hero.Cover || hero.Image)
    : '';
  const heroScore = hero ? String(hero.MALScore ?? '—') : '—';

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-surface-border bg-gradient-to-br from-surface-raised via-surface to-black">
        <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[220px] p-8 md:min-h-[320px]">
            <div className="absolute inset-0 opacity-40">
              {heroImg ? (
                <img src={heroImg} alt="" className="h-full w-full object-cover blur-2xl" />
              ) : (
                <div className="h-full w-full bg-zinc-900" />
              )}
            </div>
            <div className="relative flex h-full flex-col justify-end">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">
                Featured
              </p>
              <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {hero?.Name ?? (topLoading ? 'Loading spotlight…' : 'Discover something new')}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  MAL {heroScore}
                </span>
                {hero?._id ? (
                  <Link
                    to={`/anime/${hero._id}`}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                  >
                    View details
                  </Link>
                ) : null}
                {hero?._id ? (
                  <Link
                    to={`/watch/${hero._id}/1`}
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:border-white/30"
                  >
                    Watch now
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
          <div className="relative hidden border-t border-surface-border md:block md:border-l md:border-t-0">
            {heroImg ? (
              <img src={heroImg} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[260px] items-center justify-center bg-zinc-950 text-sm text-zinc-600">
                Poster
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Top rated</h2>
            <p className="text-sm text-zinc-500">Curated by community scores</p>
          </div>
          <button
            type="button"
            disabled={topLoading || !topHasMore}
            onClick={() => loadTop(topPage + 1, true)}
            className="rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Load more
          </button>
        </div>

        {topError ? (
          <UiState
            title="Couldn’t load top titles"
            description="The ratings feed may be temporarily unavailable."
            onRetry={() => loadTop(1, false)}
          />
        ) : topLoading && topRated.length === 0 ? (
          <SkeletonCard />
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {topRated.map((a) => (
              <AnimeCard
                key={a._id}
                id={a._id}
                title={a.Name}
                image={a.ImagePath || a.Cover || a.Image}
                malScore={a.MALScore}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Browse by genre</h2>
          <p className="text-sm text-zinc-500">Tap a genre to preview a row on Home</p>
        </div>
        <GenrePills activeGenre={activeGenre} onSelect={onSelectGenre} />

        {activeGenre ? (
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-sm font-semibold text-zinc-200">{activeGenre}</h3>
              <div className="flex items-center gap-2">
                <Link
                  to={`/genre/${encodeURIComponent(activeGenre)}?page=1`}
                  className="text-xs font-semibold text-accent-muted hover:text-accent"
                >
                  Open grid
                </Link>
                <button
                  type="button"
                  disabled={genreLoading || !genreHasMore}
                  onClick={() => loadGenre(activeGenre, genrePage + 1, true)}
                  className="rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  More
                </button>
              </div>
            </div>

            {genreError ? (
              <UiState
                title="Genre browse failed"
                description="Try another genre or retry."
                onRetry={() => loadGenre(activeGenre, 1, false)}
              />
            ) : genreLoading && genreItems.length === 0 ? (
              <SkeletonCard count={6} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {genreItems.map((a) => (
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
        ) : null}
      </section>
    </div>
  );
}
