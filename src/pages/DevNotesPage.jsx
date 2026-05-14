/**
 * Developer-oriented notes page (stack, proxy, env, API quirks).
 *
 * @file Static informational content; no data fetching.
 * @imports react-router-dom Link
 * @exports DevNotesPage component
 * @gotchas Keep in sync with README/env when deployment or API behavior changes.
 */
import { Link } from 'react-router-dom';

/**
 * @returns {JSX.Element}
 */
export function DevNotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-muted">Developers</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Dev notes</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Quick reference for how this repo is wired. For full setup and deploy steps, see the
          project README in the repository.
        </p>
      </div>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Stack</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-400">
          <li>Vite + React</li>
          <li>React Router v6</li>
          <li>Tailwind CSS</li>
          <li>Zustand (watchlist + light player context, persisted locally)</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold text-zinc-200">API access and CORS</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          The browser calls a same-origin base path, default{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">/anipub-api</code>
          , which is proxied to{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">
            https://anipub.xyz
          </code>
          . In development this is handled by{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">vite.config.js</code>{' '}
          (<code className="text-xs text-zinc-300">server.proxy</code> and{' '}
          <code className="text-xs text-zinc-300">preview.proxy</code>). On Vercel,{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">vercel.json</code>{' '}
          rewrites the same path to the upstream host so JSON requests are not cross-origin in the
          browser.
        </p>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Environment variables</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          See <span className="text-zinc-300">env.md</span> in the repo for the full list. Most
          deploys can leave{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">VITE_API_BASE</code>{' '}
          unset and keep using{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">/anipub-api</code>{' '}
          as long as your hosting mirrors the Vite/Vercel proxy pattern. For static hosting without
          rewrites, set <code className="text-xs text-zinc-300">VITE_API_BASE</code> to a URL you
          control that forwards to the catalog origin.
        </p>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold text-zinc-200">API quirks (client)</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
          <li>
            <strong className="text-zinc-300">Images:</strong> relative paths are absolutized in{' '}
            <code className="text-xs text-zinc-300">fixImage()</code> (see{' '}
            <code className="text-xs text-zinc-300">src/lib/api.js</code>).
          </li>
          <li>
            <strong className="text-zinc-300">Streaming links:</strong> values often include a{' '}
            <code className="text-xs text-zinc-300">src=</code> prefix; the player strips it via{' '}
            <code className="text-xs text-zinc-300">stripSrc()</code>. Episode 1 uses{' '}
            <code className="text-xs text-zinc-300">local.link</code>; later episodes use{' '}
            <code className="text-xs text-zinc-300">local.ep[n]</code> with the documented offset.
          </li>
          <li>
            <strong className="text-zinc-300">Genre pagination:</strong> this client uses lowercase{' '}
            <code className="text-xs text-zinc-300">page=</code>; some docs show{' '}
            <code className="text-xs text-zinc-300">Page=</code>, which did not paginate reliably in
            earlier checks.
          </li>
          <li>
            <strong className="text-zinc-300">Cast data:</strong> character lists can occasionally
            disagree with the rest of the payload; that is upstream metadata, not the UI layer.
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-surface-border bg-surface-raised p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Streaming vs fetch</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Fixing the API base avoids CORS on <em>your</em> JSON requests. Embedded players still load
          third-party iframes; those hosts may impose their own framing or referrer rules. That is
          separate from the proxy story above.
        </p>
      </section>

      <p className="text-center text-sm text-zinc-600">
        <Link to="/" className="text-zinc-400 underline decoration-zinc-800 underline-offset-4 hover:text-zinc-200">
          Back to home
        </Link>
      </p>
    </div>
  );
}
