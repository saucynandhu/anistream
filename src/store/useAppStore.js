/**
 * Lightweight global client state (Zustand) for cross-route UX.
 *
 * @file Holds search text, optional watchlist, and the currently playing route context.
 * @imports zustand vanilla create + middleware persist
 * @exports useAppStore hook
 * @gotchas Watchlist IDs are internal `_id` strings; persistence uses localStorage key `anistream-store`.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * @typedef {Object} AppState
 * @property {string} headerSearchQuery Current text mirrored from the header search input
 * @property {(q: string) => void} setHeaderSearchQuery Updates header search text
 * @property {string[]} watchlistIds Internal anime ids (stringified)
 * @property {(id: string) => void} toggleWatchlist Adds/removes id
 * @property {{ animeId: string, episode: number } | null} currentlyPlaying Last known player route context
 * @property {(animeId: string, episode: number) => void} setCurrentlyPlaying Updates player context
 */

/**
 * Creates the persisted Zustand store.
 *
 * @returns {import('zustand').UseBoundStore<import('zustand').StoreApi<any>>}
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      headerSearchQuery: '',
      /**
       * @param {string} q
       */
      setHeaderSearchQuery: (q) => set({ headerSearchQuery: q }),

      watchlistIds: [],
      /**
       * @param {string} id
       */
      toggleWatchlist: (id) => {
        const cur = get().watchlistIds;
        const has = cur.includes(id);
        set({
          watchlistIds: has ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },

      currentlyPlaying: null,
      /**
       * @param {string} animeId
       * @param {number} episode
       */
      setCurrentlyPlaying: (animeId, episode) =>
        set({ currentlyPlaying: { animeId, episode } }),

      searchCache: [],
      /**
       * @param {any[]} items
       */
      setSearchCache: (items) => set({ searchCache: items }),
    }),
    {
      name: 'anistream-store',
      partialize: (state) => ({
        watchlistIds: state.watchlistIds,
        currentlyPlaying: state.currentlyPlaying,
      }),
    },
  ),
);
