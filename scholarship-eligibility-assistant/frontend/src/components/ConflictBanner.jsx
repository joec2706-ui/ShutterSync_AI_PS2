import { useApp } from '../context/AppContext';

export default function ConflictBanner() {
  const { conflicts, resolveConflict } = useApp();

  if (!conflicts || conflicts.length === 0) return null;

  return (
    <aside aria-label="Data discrepancies" className="space-y-3">
      {conflicts.map((conflict) => (
        <div
          key={conflict.id}
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5" role="img" aria-label="warning">⚠️</span>
              <div>
                <h2 className="text-sm font-bold text-amber-900">
                  Data Conflict Detected: {conflict.fieldName}
                </h2>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  {conflict.message}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-white/80 border border-amber-200 px-2 py-0.5">
                    Profile: <strong>{conflict.profileDisplay}</strong>
                  </span>
                  <span className="rounded bg-emerald-100 border border-emerald-300 text-emerald-900 px-2 py-0.5 font-medium">
                    Verified Document: <strong>{conflict.documentDisplay}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 self-end sm:self-start">
              {conflict.resolutions?.map((res) => (
                <button
                  key={res.action}
                  type="button"
                  onClick={() => resolveConflict(conflict, res.action)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    res.action === 'APPLY_DOCUMENT_VALUE'
                      ? 'bg-amber-800 text-white hover:bg-amber-900 shadow-sm'
                      : 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}
