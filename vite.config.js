/**
 * Vite build + dev-server configuration for AniStream.
 *
 * @file Wires React and defines the `/anipub-api` reverse proxy for local development and `vite preview`.
 * @imports vite `defineConfig`, `@vitejs/plugin-react`
 * @exports default Vite config
 * @gotchas
 * - The `server.proxy` / `preview.proxy` blocks route `/anipub-api/**` through Vite so fetches are same-origin in the browser (bypasses CORS on upstream error responses).
 * - Static production (`npm run build` + plain static hosting) does **not** include this proxy — set `VITE_API_BASE` to a real edge proxy path/URL (see `env.md`).
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const anipubProxy = {
  target: 'https://anipub.xyz',
  changeOrigin: true,
  secure: true,
  rewrite: (path) => path.replace(/^\/anipub-api/, ''),
};

const anilistProxy = {
  target: 'https://graphql.anilist.co',
  changeOrigin: true,
  secure: true,
  rewrite: (path) => path.replace(/^\/anilist-api/, ''),
};

/**
 * @returns {import('vite').UserConfig}
 */
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/anipub-api': anipubProxy,
      '/anilist-api': anilistProxy,
    },
  },
  preview: {
    proxy: {
      '/anipub-api': anipubProxy,
      '/anilist-api': anilistProxy,
    },
  },
});
