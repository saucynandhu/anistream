/**
 * Application router (React Router v6 `createBrowserRouter`).
 *
 * @file Central route table for AniStream pages.
 * @imports react-router-dom, Layout, pages
 * @exports router
 * @gotchas `future` flags omitted for compatibility; keep paths in sync with README.
 */
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './components/Layout.jsx';
import { Home } from './pages/Home.jsx';
import { AnimePage } from './pages/AnimePage.jsx';
import { WatchPage } from './pages/WatchPage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { GenrePage } from './pages/GenrePage.jsx';

/**
 * Browser router instance used by `RouterProvider` in `main.jsx`.
 *
 * @type {import('react-router-dom').Router}
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'anime/:id', element: <AnimePage /> },
      { path: 'watch/:id/:episode', element: <WatchPage /> },
      { path: 'genre/:genre', element: <GenrePage /> },
    ],
  },
]);
