/**
 * Reusable anime grid/list card with poster, title, and MAL score badge.
 *
 * @file Primary discovery UI element used on Home, Search, and Genre pages.
 * @imports react, react-router-dom Link, ../lib/api resolveMediaUrl, PropTypes
 * @exports AnimeCard component
 * @gotchas Long titles are clamped to two lines; images lazy-load.
 */
import { memo } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { resolveMediaUrl } from '../lib/api';

/**
 * @param {Object} props
 * @param {string|number} props.id Anime `_id`
 * @param {string} props.title Display title
 * @param {string} [props.image] Poster path/url
 * @param {string|number} [props.malScore] MAL score text
 * @returns {JSX.Element}
 */
function AnimeCardComponent({ id, title, image, malScore }) {
  const src = resolveMediaUrl(image);
  const score =
    malScore === undefined || malScore === null || String(malScore).trim() === ''
      ? '—'
      : String(malScore);

  return (
    <article className="w-[150px] shrink-0 sm:w-[170px]">
      <Link
        to={`/anime/${id}`}
        className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-xl"
      >
        <div className="relative h-full overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-card transition duration-300 will-change-transform group-hover:-translate-y-0.5 group-hover:scale-[1.02] group-hover:shadow-[0_16px_50px_rgba(0,0,0,0.55)] flex flex-col">
          <div className="aspect-[2/3] w-full overflow-hidden bg-zinc-900">
            {src ? (
              <img
                src={src}
                alt={title || 'Anime poster'}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                No art
              </div>
            )}
          </div>
          <div className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            {score}
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
          {title}
        </p>
      </Link>
    </article>
  );
}

AnimeCardComponent.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  image: PropTypes.string,
  malScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export const AnimeCard = memo(AnimeCardComponent);
