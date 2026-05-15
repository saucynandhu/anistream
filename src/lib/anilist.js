/**
 * AniList GraphQL integration for season grouping and chronological relations.
 *
 * @file Fetches relation trees from AniList and resolves corresponding AniPub IDs.
 * @imports ./api
 * @exports getRelations, resolveAnipubId, sortSeasons
 * @gotchas
 * - **Rate Limiting:** AniList limits to 90 req/min. We use a 700ms delay between calls.
 * - **ID Resolution:** Best-effort title matching. Alternate romanizations may fail.
 * - **Format Filter:** Only includes TV, MOVIE, OVA, ONA.
 */

import { quickSearch } from './api';

const ANILIST_ENDPOINT = '/anilist-api';

/**
 * Simple request queue to honor AniList's rate limits.
 * @type {Promise<void>}
 */
let queue = Promise.resolve();
const MIN_GAP_MS = 700;

/**
 * Enqueues a fetch call with a minimum delay.
 *
 * @param {string} query
 * @param {Record<string, any>} variables
 * @returns {Promise<any>}
 */
async function queuedFetch(query, variables) {
  const current = queue;
  let resolveDone;
  queue = new Promise((r) => {
    resolveDone = r;
  });

  await current;

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
    return await res.json();
  } finally {
    setTimeout(resolveDone, MIN_GAP_MS);
  }
}

/**
 * Searches AniPub for a matching title to resolve an internal ID.
 *
 * @param {string} title
 * @returns {Promise<number | null>}
 * @gotchas Prefers exact case-insensitive match, falls back to first result.
 */
export async function resolveAnipubId(title) {
  if (!title) return null;
  try {
    const results = await quickSearch(title);
    if (!results || results.length === 0) return null;

    // Try exact match first
    const exact = results.find(
      (r) => r.Name?.toLowerCase() === title.toLowerCase()
    );
    return exact ? exact.Id : results[0].Id;
  } catch {
    return null;
  }
}

/**
 * Sorts season entries chronologically by startDate.
 *
 * @param {any[]} seasons
 * @returns {any[]}
 */
export function sortSeasons(seasons) {
  return [...seasons].sort((a, b) => {
    const da = a.startDate;
    const db = b.startDate;

    if (!da.year) return 1;
    if (!db.year) return -1;

    if (da.year !== db.year) return da.year - db.year;
    if (da.month !== db.month) return (da.month || 0) - (db.month || 0);
    return (da.day || 0) - (db.day || 0);
  });
}

/**
 * Fetches the full franchise relation tree from AniList.
 *
 * @param {number|string} initialMalId
 * @returns {Promise<{ current: any, seasons: any[] } | null>}
 */
export async function getRelations(initialMalId) {
  const visited = new Set();
  const pool = new Map();
  const queue = [{ malId: Number(initialMalId) }];
  
  const allowedRelations = ['SEQUEL', 'PREQUEL', 'SIDE_STORY', 'ALTERNATIVE_VERSION'];
  const allowedFormats = ['TV', 'MOVIE', 'OVA', 'ONA'];
  
  let rootMedia = null;
  let requests = 0;
  const MAX_REQUESTS = 15; // Safety cap for large franchises (e.g. Pokemon)

  const query = `
    query ($malId: Int, $anilistId: Int) {
      Media(idMal: $malId, id: $anilistId, type: ANIME) {
        id
        idMal
        title { romaji english }
        startDate { year month day }
        coverImage { medium }
        format
        status
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english }
              startDate { year month day }
              coverImage { medium }
              format
              status
            }
          }
        }
      }
    }
  `;

  while (queue.length > 0 && requests < MAX_REQUESTS) {
    const { malId, anilistId } = queue.shift();
    if (anilistId && visited.has(anilistId)) continue;

    try {
      requests++;
      const { data } = await queuedFetch(query, { malId, anilistId });
      const media = data?.Media;
      if (!media) continue;

      if (visited.has(media.id)) continue;
      visited.add(media.id);

      // Save the root media (the one the user is actually viewing)
      if (String(media.idMal) === String(initialMalId)) {
        rootMedia = media;
      }

      // Add self to pool
      pool.set(media.id, {
        anilistId: media.id,
        malId: media.idMal,
        title: media.title.english || media.title.romaji,
        startDate: media.startDate,
        coverImage: media.coverImage.medium,
        relationType: 'CURRENT', // Default, will be updated if it's a relation to something else
        isCurrent: String(media.idMal) === String(initialMalId),
      });

      // Process relations
      if (media.relations?.edges) {
        for (const edge of media.relations.edges) {
          const node = edge.node;
          if (allowedFormats.includes(node.format)) {
            // Collect all allowed relations into the pool
            if (allowedRelations.includes(edge.relationType)) {
              if (!pool.has(node.id)) {
                pool.set(node.id, {
                  anilistId: node.id,
                  malId: node.idMal,
                  title: node.title.english || node.title.romaji,
                  startDate: node.startDate,
                  coverImage: node.coverImage.medium,
                  relationType: edge.relationType,
                });
              }

              // Recursively walk Sequels and Prequels
              if (
                (edge.relationType === 'SEQUEL' || edge.relationType === 'PREQUEL') &&
                !visited.has(node.id)
              ) {
                queue.push({ anilistId: node.id });
              }
            }
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AniList] Walk failed for node:', { malId, anilistId }, err);
      if (requests === 1) return null; // If first request fails, bail
    }
  }

  if (!rootMedia || pool.size <= 1) return null;

  const sorted = sortSeasons(Array.from(pool.values()));

  // Resolve AniPub IDs for navigation
  const withIds = await Promise.all(
    sorted.map(async (s) => {
      if (s.isCurrent) return s;
      const anipubId = await resolveAnipubId(s.title);
      return { ...s, anipubId };
    })
  );

  return {
    current: rootMedia,
    seasons: withIds,
  };
}
