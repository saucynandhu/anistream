/**
 * React root entrypoint for AniStream.
 *
 * @file Mounts the SPA and enables strict mode.
 * @imports react, react-dom/client, react-router-dom, router, styles
 * @exports none
 * @gotchas Router is created in `router.jsx` to keep routing testable in isolation.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import './index.css';

/**
 * Bootstraps the React tree into `#root`.
 *
 * @returns {void}
 */
function bootstrap() {
  const el = document.getElementById('root');
  if (!el) throw new Error('Missing #root element');
  createRoot(el).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

bootstrap();
