/**
 * Watch experience: iframe embed + episode navigation + persistence.
 *
 * @file Loads streaming payload, maps episodes to iframe URLs, and stores last watched locally.
 * @imports react, react-router-dom, api, VideoPlayer, UiState, lastWatched, store
 * @exports WatchPage component
 * @gotchas
 * - Third-party iframes may refuse embedding depending on headers; no client-only workaround exists.
 * - Episode mapping follows AniPub rules (EP1 uses `local.link`, EP2+ uses `local.ep[n-2]`).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  countStreamingEpisodes,
  fetchStreamingDetails,
  getStreamingIframeSrcForEpisode,
} from '../lib/api';
import { VideoPlayer } from '../components/VideoPlayer.jsx';
import { UiState } from '../components/UiState.jsx';
import { setLastWatchedEpisode } from '../lib/lastWatched.js';
import { useAppStore } from '../store/useAppStore.js';

/**
 * @returns {JSX.Element}
 */
export function WatchPage() {
  const { id, episode } = useParams();
  const navigate = useNavigate();
  const setCurrentlyPlaying = useAppStore((s) => s.setCurrentlyPlaying);

  const epNum = useMemo(() => {
    const n = Number(episode);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }, [episode]);

  const [local, setLocal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchStreamingDetails(id)
      .then((data) => {
        if (cancelled) return;
        setLocal(data?.local || null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e);
        setLocal(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const total = useMemo(() => countStreamingEpisodes(local), [local]);

  const iframeSrc = useMemo(() => {
    if (!local) return '';
    return getStreamingIframeSrcForEpisode(local, epNum);
  }, [local, epNum]);

  useEffect(() => {
    if (!id || total <= 0) return;
    if (epNum > total) {
      navigate(`/watch/${id}/${total}`, { replace: true });
    }
  }, [id, epNum, total, navigate]);

  useEffect(() => {
    if (!id) return;
    if (epNum < 1) {
      navigate(`/watch/${id}/1`, { replace: true });
    }
  }, [id, epNum, navigate]);

  useEffect(() => {
    if (!id) return;
    setLastWatchedEpisode(id, epNum);
    setCurrentlyPlaying(String(id), epNum);
  }, [id, epNum, setCurrentlyPlaying]);

  function goEpisode(next) {
    if (!id) return;
    navigate(`/watch/${id}/${next}`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-1/3 animate-pulse rounded bg-zinc-900" />
        <div className="relative w-full overflow-hidden rounded-2xl border border-surface-border bg-black">
          <div className="relative aspect-video w-full">
            <div
              className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error || !local) {
    return (
      <UiState
        title="Couldn’t load the player"
        description="Streaming metadata may be missing for this title."
        onRetry={() => setReloadToken((t) => t + 1)}
      />
    );
  }

  const canPrev = epNum > 1;
  const canNext = total > 0 ? epNum < total : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {String(local.Name || local.name || 'Watching')}
          </h1>
          <p className="text-sm text-zinc-500">
            Episode {epNum}
            {total ? <span className="text-zinc-600"> / {total}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => goEpisode(epNum - 1)}
            className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => goEpisode(epNum + 1)}
            className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Next
          </button>
          {id ? (
            <Link
              to={`/anime/${id}`}
              className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Details
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <VideoPlayer key={iframeSrc || 'empty'} src={iframeSrc} title={`Episode ${epNum}`} />

        <aside className="space-y-3">
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Episodes</p>
            <div className="mt-3 max-h-[320px] overflow-auto pr-1 scrollbar-thin lg:max-h-[520px]">
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-4">
                {Array.from({ length: Math.max(total, epNum) }).map((_, idx) => {
                  const n = idx + 1;
                  const active = n === epNum;
                  return (
                   <button
                       key={n}
                       type="button"
                       onClick={() => goEpisode(n)}
                       className={[
                         'flex items-center justify-center rounded-lg border px-2 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-[32px]',
                         active
                           ? 'border-accent bg-accent/15 text-accent-muted'
                           : 'border-surface-border bg-surface text-zinc-200 hover:border-zinc-600',
                       ].join(' ')}
                     >
                       {n}
                     </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
