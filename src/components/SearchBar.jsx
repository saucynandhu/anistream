/**
 * Header search with debounced suggestions and navigation to full results.
 *
 * @file Uses `fetchSearchSuggestions` only; full results live on `/search`.
 * @imports react, react-router-dom, ../lib/api, ../store/useAppStore, PropTypes
 * @exports SearchBar component
 * @gotchas Clicking outside closes the dropdown; Enter submits to `/search?q=`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { fetchSearchSuggestions } from '../lib/api';
import { useAppStore } from '../store/useAppStore';
import { fuzzySearch } from '../lib/fuzzy';

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
export function SearchBar({ className = '' }) {
  const navigate = useNavigate();
  const headerSearchQuery = useAppStore((s) => s.headerSearchQuery);
  const setHeaderSearchQuery = useAppStore((s) => s.setHeaderSearchQuery);

  const [local, setLocal] = useState(headerSearchQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  /** @type {[Array<{Name:string,Id:number,Image?:string}>, any]} */
  const [items, setItems] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => {
    setLocal(headerSearchQuery);
  }, [headerSearchQuery]);

  useEffect(() => {
    function onDocDown(e) {
      if (!rootRef.current) return;
      if (e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, []);

  useEffect(() => {
    const q = local.trim();
    if (!q) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const t = window.setTimeout(() => {
      fetchSearchSuggestions(q)
        .then((data) => {
          if (cancelled) return;
          const raw = Array.isArray(data) ? data : [];
          const fuzzyResults = fuzzySearch(raw, q);
          setItems(fuzzyResults.slice(0, 8));
        })
        .catch(() => {
          if (cancelled) return;
          setItems([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [local]);

  const showDropdown = useMemo(
    () => open && local.trim().length > 0,
    [open, local],
  );

  /**
   * Navigates to anime detail.
   * @param {number} id
   */
  function goAnime(id) {
    setOpen(false);
    navigate(`/anime/${id}`);
  }

  /**
   * Navigates to full search results.
   */
  function submit() {
    const q = local.trim();
    if (!q) return;
    setHeaderSearchQuery(q);
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={rootRef} className={['relative w-full max-w-xl', className].join(' ')}>
      <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-raised px-3 py-2 shadow-inner">
        <span className="select-none text-zinc-500" aria-hidden>
          ⌕
        </span>
        <input
          value={local}
          onChange={(e) => {
            setLocal(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Search anime…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
          aria-label="Search anime"
          autoComplete="off"
        />
        {loading ? (
           <span className="text-xs text-zinc-500">…</span>
         ) : (
           <button
             type="button"
             onClick={submit}
             aria-label="Search anime"
             className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised"
           >
             Search
           </button>
         )}
      </div>

      {showDropdown ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-card">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-zinc-500">
              {loading ? 'Searching…' : 'No quick matches'}
            </div>
          ) : (
            <ul className="max-h-80 overflow-auto py-1 scrollbar-thin">
              {items.map((it) => (
                <li key={it.Id}>
                  <button
                     type="button"
                     className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-zinc-900 focus-visible:outline-none focus-visible:bg-zinc-900"
                     onClick={() => goAnime(it.Id)}
                   >
                    <span className="line-clamp-1 flex-1 text-zinc-100">{it.Name}</span>
                    <span className="text-xs text-zinc-500">Open</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

SearchBar.propTypes = {
  className: PropTypes.string,
};
