export function Spinner({ label = 'Loading…' }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-16 text-navy-700">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function ErrorBox({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
      <p className="font-semibold">{title}</p>
      {message && <p className="mt-1 text-sm">{message}</p>}
      {onRetry && <button type="button" onClick={onRetry} className="btn-secondary mt-3">Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message, children }) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}
