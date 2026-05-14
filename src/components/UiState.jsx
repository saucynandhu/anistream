/**
 * Friendly error / empty state with optional retry action.
 *
 * @file Used across pages to avoid blank screens on API failures.
 * @imports none
 * @exports UiState component
 * @gotchas Keep copy calm; this is user-facing recovery UI.
 */

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {() => void} [props.onRetry]
 * @returns {JSX.Element}
 */
export function UiState({ title, description, onRetry }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-surface-border bg-surface-raised p-8 text-center">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
