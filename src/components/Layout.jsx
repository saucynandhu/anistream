/**
 * Application shell: sticky header, main outlet, and subtle page transitions.
 *
 * @file Wraps all routes with consistent navigation chrome.
 * @imports react-router-dom Outlet/Link/useLocation, SearchBar
 * @exports RootLayout component
 * @gotchas `location.pathname` keys the transition wrapper to re-trigger CSS animation.
 */
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SearchBar } from './SearchBar';

/**
 * @returns {JSX.Element}
 */
export function RootLayout() {
  const location = useLocation();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="shrink-0 text-base font-semibold tracking-tight">
              <span className="text-white">Ani</span>
              <span className="text-accent">Stream</span>
            </Link>
            <Link
              to="/genre/Action?page=1"
              className="hidden text-sm text-zinc-400 hover:text-zinc-200 sm:inline"
            >
              Browse
            </Link>
          </div>
          <SearchBar className="sm:ml-4" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-surface-border py-10 text-center text-xs text-zinc-600">
        Data and streams are provided by third-party APIs; AniStream is a non-commercial UI demo.
      </footer>
    </div>
  );
}
