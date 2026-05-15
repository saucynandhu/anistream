/**
 * Anime metadata page (details + cast + episode list).
 *
 * @file Loads `fetchAnimeDetails` and `fetchStreamingDetails` in parallel for accurate episode counts.
 * @imports react, react-router-dom, api, components, store, lastWatched
 * @exports AnimePage component
 * @gotchas
 * - `characters[]` is shaped like MAL/Jikan data and may occasionally be inconsistent with `local` metadata (upstream issue).
 * - Episode navigation should prefer streaming-derived counts to match `/watch` mapping.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  countStreamingEpisodes,
  fetchAnimeDetails,
  fetchStreamingDetails,
  resolveMediaUrl,
} from '../lib/api';
import { EpisodeList } from '../components/EpisodeList.jsx';
import { UiState } from '../components/UiState.jsx';
import { useAppStore } from '../store/useAppStore.js';
import { getLastWatchedEpisode } from '../lib/lastWatched.js';

/**
 * @returns {JSX.Element}
 */
export function AnimePage() {
  const { id } = useParams();
  const toggleWatchlist = useAppStore((s) => s.toggleWatchlist);
  const watchlistIds = useAppStore((s) => s.watchlistIds);

  const [detail, setDetail] = useState(null);
  /** @type {[any[]|null, function]} */
  const [characters, setCharacters] = useState(null);
  const [streamLocal, setStreamLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchAnimeDetails(id), fetchStreamingDetails(id)])
      .then(([d, s]) => {
        if (cancelled) return;
        setDetail(d?.local || null);
        const ch = Array.isArray(d?.characters) ? d.characters : null;
        setCharacters(ch);
        setStreamLocal(s?.local || null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e);
        setDetail(null);
        setCharacters(null);
        setStreamLocal(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const episodeCount = useMemo(() => {
    const streamCount = countStreamingEpisodes(streamLocal);
    const metaCount = Number(detail?.epCount);
    const meta = Number.isFinite(metaCount) && metaCount > 0 ? Math.floor(metaCount) : 0;
    return Math.max(streamCount, meta);
  }, [detail, streamLocal]);

  const lastWatched = id ? getLastWatchedEpisode(id) : null;
  const inList = id ? watchlistIds.includes(String(id)) : false;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-44 animate-pulse rounded-3xl bg-zinc-900" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-900" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <UiState
        title="Anime not found"
        description="This id may be invalid or temporarily missing from the catalog."
        onRetry={() => setReloadKey((k) => k + 1)}
      />
    );
  }

  const banner = resolveMediaUrl(detail.Cover || detail.ImagePath);
  const poster = resolveMediaUrl(detail.ImagePath || detail.Cover);
  const genres = Array.isArray(detail.Genres) ? detail.Genres : [];

  /** @type {any[]} */
  const castRows = Array.isArray(characters) ? characters : [];

  return (
    <article className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-surface-border">
        <div className="relative h-44 w-full bg-zinc-950 sm:h-56">
          {banner ? (
            <img src={banner} alt={`${detail.Name} banner`} className="h-full w-full object-cover opacity-70" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        </div>

        <div className="relative -mt-16 flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end">
          <div className="w-[140px] shrink-0 overflow-hidden rounded-2xl border border-surface-border bg-surface-raised shadow-card sm:w-[170px]">
            <div className="aspect-[2/3] w-full bg-zinc-900">
              {poster ? (
                <img src={poster} alt={`${detail.Name} poster`} className="h-full w-full object-cover" />
              ) : null}
            </div>
          </div>

          <div className="flex-1 space-y-3 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                MAL {String(detail.MALScore ?? '—')}
              </span>
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {String(detail.Status ?? 'Unknown')}
              </span>
              {id ? (
               <button
                   type="button"
                   onClick={() => toggleWatchlist(String(id))}
                   className="rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                 >
                   {inList ? 'Saved' : 'Watchlist'}
                 </button>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {String(detail.Name || 'Untitled')}
            </h1>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <Link
                  key={g}
                  to={`/genre/${encodeURIComponent(g)}?page=1`}
                  className="rounded-full border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-200 hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="order-2 space-y-6 lg:order-1">
          <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Synopsis</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
              {String(detail.DescripTion || detail.Description || 'No synopsis available.')}
            </p>
          </section>

          <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <h2 className="text-sm font-semibold text-zinc-200">Production</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Studios</dt>
                <dd className="mt-1 text-zinc-200">{String(detail.Studios || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Aired</dt>
                <dd className="mt-1 text-zinc-200">{String(detail.Aired || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Duration</dt>
                <dd className="mt-1 text-zinc-200">{String(detail.Duration || '—')}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">Episodes</dt>
                <dd className="mt-1 text-zinc-200">{String(episodeCount || '—')}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-sm font-semibold text-zinc-200">Cast</h2>
              <p className="max-w-md text-right text-xs text-zinc-500">
                Voice actor listings come from upstream metadata and may occasionally mismatch the
                title.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {/* FIXME: Upstream occasionally returns mismatched `characters[]` vs `local` (e.g. unrelated cast rows while the poster/title are correct). */}
              {castRows.length === 0 ? (
                <p className="text-sm text-zinc-500">No cast information.</p>
              ) : (
                castRows.slice(0, 24).map((row, idx) => {
                  const ch = row?.character?.name || row?.name || 'Character';
                  const role = row?.role || '—';
                  const vas = Array.isArray(row?.voice_actors) ? row.voice_actors : [];
                  const primary = vas[0];
                  const vaName = primary?.person?.name || '—';
                  const lang = primary?.language || '—';
                  return (
                    <div
                      key={`${ch}-${idx}`}
                      className="flex flex-col gap-1 rounded-xl border border-surface-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{String(ch)}</p>
                        <p className="text-xs text-zinc-500">{String(role)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-200">{String(vaName)}</p>
                        <p className="text-xs text-zinc-500">{String(lang)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          {id ? (
            <EpisodeList animeId={id} episodeCount={episodeCount} initialHighlight={lastWatched} />
          ) : null}
          {id ? (
            <Link
              to={`/watch/${id}/${Math.max(1, lastWatched || 1)}`}
              className="block rounded-2xl bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Resume / Play
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
