/**
 * React root entrypoint for AniStream.
 *
 * @file Mounts the SPA and enables strict mode.
 * @imports react, react-dom/client, react-router-dom, router, styles
 * @exports none
 * @gotchas Router is created in `router.jsx` to keep routing testable in isolation.
 */
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { fetchTopRated } from './lib/api';
import { useAppStore } from './store/useAppStore';
import './index.css';

/**
 * Bootstraps the React tree and initializes the search cache.
 */
function AppRoot() {
  const setSearchCache = useAppStore((s) => s.setSearchCache);

  useEffect(() => {
    // Pre-fetch top 3 pages for local fuzzy fallback
    Promise.allSettled([
      fetchTopRated(1),
      fetchTopRated(2),
      fetchTopRated(3),
    ]).then((results) => {
      const all = results
        .filter((r) => r.status === 'fulfilled')
        .flatMap((r) => (Array.isArray(r.value?.AniData) ? r.value.AniData : []));
      
      // Dedupe by _id
      const seen = new Set();
      const unique = all.filter((item) => {
        if (!item?._id || seen.has(item._id)) return false;
        seen.add(item._id);
        return true;
      });
      setSearchCache(unique);
    });
  }, [setSearchCache]);

  return (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

/**
 * Bootstraps the React tree into `#root`.
 *
 * @returns {void}
 */
function bootstrap() {
  const el = document.getElementById('root');
  if (!el) throw new Error('Missing #root element');
  createRoot(el).render(<AppRoot />);
}

bootstrap();
