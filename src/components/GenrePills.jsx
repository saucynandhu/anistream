/**
 * Horizontal genre filter chips for the Home page.
 *
 * @file Renders a static list of common genres; clicking triggers parent callback.
 * @imports PropTypes
 * @exports GenrePills, DEFAULT_GENRES constant
 * @gotchas Genres must match API labels loosely; unknown genres still query the API.
 */
import PropTypes from 'prop-types';

/** @type {string[]} */
export const DEFAULT_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Supernatural',
  'Thriller',
];

/**
 * @param {Object} props
 * @param {string | null} props.activeGenre
 * @param {(genre: string) => void} props.onSelect
 * @returns {JSX.Element}
 */
export function GenrePills({ activeGenre, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_GENRES.map((g) => {
        const active = activeGenre === g;
        return (
          <button
             key={g}
             type="button"
             onClick={() => onSelect(g)}
             aria-pressed={active}
             aria-label={`${g} genre${active ? ' (selected)' : ''}`}
             className={[
               'rounded-full border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
               active
                 ? 'border-accent bg-accent/15 text-accent-muted'
                 : 'border-surface-border bg-surface-raised text-zinc-300 hover:border-zinc-600',
             ].join(' ')}
           >
             {g}
           </button>
        );
      })}
    </div>
  );
}

GenrePills.propTypes = {
  activeGenre: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
