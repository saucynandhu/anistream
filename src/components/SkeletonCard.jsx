/**
 * Skeleton placeholder for `AnimeCard` while lists are loading.
 *
 * @file Uses a CSS shimmer to match the dark theme without spinners.
 * @imports PropTypes
 * @exports SkeletonCard component
 * @gotchas Width should match `AnimeCard` for consistent horizontal scrolling.
 */
import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {number} [props.count=8]
 * @returns {JSX.Element}
 */
export function SkeletonCard({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4 sm:overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-[150px] shrink-0 sm:w-[170px] h-[300px] sm:h-[330px]"
          role="status"
          aria-label="Loading anime card"
        >
          <div className="flex flex-col h-full overflow-hidden rounded-xl border border-surface-border bg-zinc-900/60">
            <div
              className="flex-1 w-full bg-[length:200%_100%] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 animate-shimmer rounded-t-xl"
              style={{ backgroundSize: '200% 100%' }}
              aria-hidden
            />
            <div className="flex-shrink-0 h-[52px] sm:h-[60px] px-4 py-2.5 flex items-center rounded-b-xl bg-zinc-800/50">
              <div className="h-3 w-3/4 rounded bg-zinc-700" aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonCard.propTypes = {
  count: PropTypes.number,
};
