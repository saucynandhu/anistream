/**
 * Fuzzy search utilities powered by Fuse.js.
 *
 * @file Provides a centralized wrapper for client-side fuzzy matching.
 * @imports fuse.js
 * @exports fuzzySearch
 */
import Fuse from 'fuse.js';

/**
 * Standard configuration for Fuse.js to balance precision and recall.
 * We prioritize 'Name' as it's the primary title field from AniPub.
 */
const DEFAULT_OPTIONS = {
  keys: ['Name', 'name'],
  threshold: 0.45, // Increased from 0.4 to 0.45 to better handle misspelled queries like "attac on titan" vs "Attack on Titan"
  location: 0,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  shouldSort: true,
};

/**
 * Performs a fuzzy search on a list of objects.
 *
 * @template T
 * @param {T[]} list The array of objects to search through.
 * @param {string} query The search string.
 * @param {Fuse.IFuseOptions<T>} [options] Overrides for Fuse.js options.
 * @returns {T[]} Sorted results matching the fuzzy criteria.
 */
export function fuzzySearch(list, query, options = {}) {
  const q = String(query || '').trim();
  if (!q || !Array.isArray(list) || list.length === 0) return list;

  const fuse = new Fuse(list, { ...DEFAULT_OPTIONS, ...options });
  const results = fuse.search(q);

  return results.map((result) => result.item);
}
