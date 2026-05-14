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
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-[150px] shrink-0 sm:w-[170px]"
          role="status"
          aria-label="Loading anime card"
        >
          <div className="overflow-hidden rounded-xl border border-surface-border bg-zinc-900/60">
            <div
              className="aspect-[2/3] w-full bg-[length:200%_100%] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
              aria-hidden
            />
          </div>
          <div className="mt-2 h-4 w-3/4 rounded bg-zinc-800" aria-hidden />
          <div className="mt-2 h-4 w-1/2 rounded bg-zinc-800" aria-hidden />
        </div>
      ))}
    </div>
  );
}

SkeletonCard.propTypes = {
  count: PropTypes.number,
};
