/**
 * Global site footer: visitor message, social links, disclaimer, and dev notes entry.
 *
 * @file Presentational footer matching the dark minimal shell (muted zinc typography).
 * @imports react-router-dom Link
 * @exports SiteFooter component
 * @gotchas External links use target=_blank and rel=noopener noreferrer.
 */
import { Link } from 'react-router-dom';

const IG_URL = 'https://www.instagram.com/nandhu_sauce/';
const GH_URL = 'https://github.com/saucynandhu';

/**
 * Renders the site-wide footer block.
 *
 * @returns {JSX.Element}
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-surface-border bg-surface/40">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-10 text-sm leading-relaxed text-zinc-500">
        <p className="text-center text-zinc-400">
          Thanks for stopping by. AniStream is a small, non-commercial front end for browsing
          catalog data and embeds — built for learning and personal use. If something breaks or
          looks off, upstream services or rate limits are often the cause; there is no guarantee of
          uptime or completeness.
        </p>

        <p className="text-center text-zinc-500">
          <span className="text-zinc-600">Made by</span>{' '}
          <span className="text-zinc-400">Nandhu</span>
          <span className="mx-2 text-zinc-700" aria-hidden>
            ·
          </span>
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition hover:text-accent-muted"
            aria-label="Nandhu on Instagram @nandhu_sauce"
          >
            Instagram @nandhu_sauce
          </a>
          <span className="mx-2 text-zinc-700" aria-hidden>
            ·
          </span>
          <a
            href={GH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 underline decoration-zinc-700 underline-offset-4 transition hover:text-accent-muted"
            aria-label="Nandhu on GitHub saucynandhu"
          >
            GitHub saucynandhu
          </a>
        </p>

        <p className="text-center text-xs text-zinc-600">
          Metadata and streams come from third-party sources. This app does not host video files.
        </p>

        <p className="text-center text-xs">
          <Link
            to="/dev"
            className="text-zinc-500 underline decoration-zinc-800 underline-offset-4 transition hover:text-zinc-300"
          >
            Dev notes
          </Link>
        </p>
      </div>
    </footer>
  );
}
