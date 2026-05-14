/**
 * Full-width 16:9 iframe player with a loading skeleton state.
 *
 * @file Embeds third-party streaming iframes from AniPub-normalized URLs.
 * @imports react, PropTypes
 * @exports VideoPlayer component
 * @gotchas
 * - Some providers may block embedding based on Referrer-Policy / X-Frame-Options; this cannot be fixed purely client-side.
 * - If playback fails silently, check the browser console network tab for the iframe document response.
 */
import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {string} props.src Normalized iframe URL (no `src=` prefix)
 * @param {string} [props.title] iframe title for accessibility
 * @returns {JSX.Element}
 */
export function VideoPlayer({ src, title = 'Episode player' }) {
  const [loaded, setLoaded] = useState(false);
  const safe = useMemo(() => (src && /^https?:\/\//i.test(src) ? src : ''), [src]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-surface-border bg-black shadow-card">
      <div className="relative aspect-video w-full">
        {!loaded || !safe ? (
          <div
            className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
            aria-hidden
          />
        ) : null}

        {safe ? (
          <iframe
            title={title}
            src={safe}
            className={[
              'absolute inset-0 h-full w-full',
              loaded ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-zinc-400">
            No streaming URL resolved for this episode.
          </div>
        )}
      </div>
    </div>
  );
}

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
};
