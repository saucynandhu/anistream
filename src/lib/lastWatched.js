/**
 * Helpers for persisting per-anime "last watched" episode in localStorage.
 *
 * @file Small, testable helpers to avoid scattering magic strings across pages.
 * @imports none
 * @exports lastWatched storage helpers
 * @gotchas Values are stored as decimal strings; invalid inputs fall back to `null`.
 */

const PREFIX = 'anistream:lastWatched:';

/**
 * @param {string|number} animeId
 * @returns {string}
 */
function keyFor(animeId) {
  return `${PREFIX}${String(animeId)}`;
}

/**
 * Reads last watched episode for an anime.
 *
 * @param {string|number} animeId
 * @returns {number | null}
 * @sideeffects reads localStorage
 */
export function getLastWatchedEpisode(animeId) {
  try {
    const raw = localStorage.getItem(keyFor(animeId));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
  } catch {
    return null;
  }
}

/**
 * Persists last watched episode for an anime.
 *
 * @param {string|number} animeId
 * @param {number} episode
 * @returns {void}
 * @sideeffects writes localStorage
 */
export function setLastWatchedEpisode(animeId, episode) {
  try {
    if (!Number.isFinite(episode) || episode < 1) return;
    localStorage.setItem(keyFor(animeId), String(Math.floor(episode)));
  } catch {
    // ignore quota / privacy mode
  }
}
