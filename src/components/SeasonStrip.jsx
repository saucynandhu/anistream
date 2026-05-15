/**
 * Horizontal scrollable strip of season relations cross-referenced from AniList.
 *
 * @file Renders chronological seasons/sequels with navigation.
 * @imports react, react-router-dom, ../lib/anilist, ../store/useAppStore
 * @exports SeasonStrip component
 * @gotchas
 * - Current anime is highlighted.
 * - Non-resolved AniPub IDs link directly to AniList.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getRelations } from '../lib/anilist';
import { useAppStore } from '../store/useAppStore';

/**
 * @param {Object} props
 * @param {number|string} props.malId
 * @returns {JSX.Element | null}
 */
export function SeasonStrip({ malId }) {
  const seasonCache = useAppStore((s) => s.seasonCache);
  const setSeasonCache = useAppStore((s) => s.setSeasonCache);

  const [loading, setLoading] = useState(false);
  const data = malId ? seasonCache[String(malId)] : null;

  useEffect(() => {
    if (!malId || data || loading) return;

    setLoading(true);
    getRelations(malId)
      .then((res) => {
        if (res && res.seasons?.length > 1) {
          setSeasonCache(malId, res);
        } else {
          setSeasonCache(malId, { empty: true });
        }
      })
      .catch(() => {
        setSeasonCache(malId, { empty: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [malId, data, loading, setSeasonCache]);

  if (loading) {
    return (
      <section className="space-y-3" aria-label="Loading seasons">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-900" />
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 w-24 shrink-0 animate-pulse rounded-xl bg-zinc-900" />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.empty || !data.seasons || data.seasons.length <= 1) return null;

  return (
    <section className="space-y-4" aria-labelledby="seasons-title">
      <div className="flex items-end justify-between">
        <h2 id="seasons-title" className="text-sm font-semibold text-zinc-200">
          Seasons
        </h2>
        <a
          href="https://anilist.co"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300"
        >
          via AniList
        </a>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin sm:gap-4">
        {data.seasons.map((s) => {
          const isCurrent = s.isCurrent;
          const hasInternal = s.anipubId && !isCurrent;
          const year = s.startDate?.year || '—';
          
          const labelMap = {
            SEQUEL: 'Sequel',
            PREQUEL: 'Prequel',
            SIDE_STORY: 'Side Story',
            ALTERNATIVE_VERSION: 'Alt',
            CURRENT: 'Watching',
          };

          const CardContent = (
            <div
              className={[
                'group relative h-32 w-24 shrink-0 overflow-hidden rounded-xl border transition-all duration-300 sm:h-40 sm:w-28',
                isCurrent
                  ? 'border-accent ring-2 ring-accent/20'
                  : 'border-surface-border bg-surface-raised hover:border-zinc-500',
              ].join(' ')}
            >
              <img
                src={s.coverImage}
                alt={s.title}
                loading="lazy"
                className={[
                  'h-full w-full object-cover transition duration-500',
                  isCurrent ? 'opacity-40 grayscale-[0.5]' : 'group-hover:scale-105',
                ].join(' ')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2">
                <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white sm:text-xs">
                  {s.title}
                </p>
                <div className="mt-1 flex items-center justify-between text-[9px] text-zinc-400">
                  <span>{year}</span>
                  <span className={isCurrent ? 'font-bold text-accent' : ''}>
                    {labelMap[s.relationType] || s.relationType}
                  </span>
                </div>
              </div>
              {isCurrent && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-white shadow-lg">
                  Current
                </div>
              )}
            </div>
          );

          if (isCurrent) {
            return <div key={s.anilistId}>{CardContent}</div>;
          }

          if (hasInternal) {
            return (
              <Link key={s.anilistId} to={`/anime/${s.anipubId}`} title={`Go to ${s.title}`}>
                {CardContent}
              </Link>
            );
          }

          // KNOWN LIMITATION: Link to AniList if AniPub ID resolution fails.
          return (
            <a
              key={s.anilistId}
              href={`https://anilist.co/anime/${s.anilistId}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`View ${s.title} on AniList (not found on AniStream)`}
            >
              {CardContent}
            </a>
          );
        })}
      </div>
    </section>
  );
}

SeasonStrip.propTypes = {
  malId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
