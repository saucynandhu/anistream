/**
 * Scrollable episode list for anime detail pages.
 *
 * @file Renders numbered buttons linking into the watch route.
 * @imports react-router-dom useNavigate
 * @exports EpisodeList component
 * @gotchas Episode count should mirror streaming payload when possible; detail `epCount` may differ.
 */
import { useNavigate } from 'react-router-dom';

/**
 * @param {Object} props
 * @param {string|number} props.animeId
 * @param {number} props.episodeCount
 * @param {number} [props.initialHighlight]
 * @returns {JSX.Element}
 */
export function EpisodeList({ animeId, episodeCount, initialHighlight }) {
  const navigate = useNavigate();
  const safeCount = Number.isFinite(episodeCount) ? Math.max(0, Math.floor(episodeCount)) : 0;

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">Episodes</h3>
        <span className="text-xs text-zinc-500">{safeCount} total</span>
      </div>
      <div className="max-h-[420px] overflow-auto pr-1 scrollbar-thin">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {Array.from({ length: safeCount }).map((_, idx) => {
            const ep = idx + 1;
            const active = initialHighlight === ep;
            return (
              <button
                key={ep}
                type="button"
                onClick={() => navigate(`/watch/${animeId}/${ep}`)}
                className={[
                  'rounded-lg border px-2 py-2 text-xs font-semibold transition',
                  active
                    ? 'border-accent bg-accent/15 text-accent-muted'
                    : 'border-surface-border bg-surface text-zinc-200 hover:border-zinc-600',
                ].join(' ')}
              >
                {ep}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
