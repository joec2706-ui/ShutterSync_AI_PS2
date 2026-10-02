import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function OpportunityUnlockWidget({ onApplyAction }) {
  const navigate = useNavigate();
  const { unlocks, setProfile } = useApp();

  if (!unlocks || !unlocks.topAction) return null;

  const top = unlocks.topAction;

  function handleSimulateAction() {
    if (onApplyAction) {
      onApplyAction(top);
    } else {
      // Navigate to simulator with params
      navigate('/simulator');
    }
  }

  function handleApplyDirectly() {
    if (top.changes) {
      setProfile((prev) => ({
        ...prev,
        ...top.changes,
        documents: {
          ...(prev.documents || {}),
          ...(top.changes.documents || {})
        }
      }));
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
            🎯
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-950">
            Opportunity Unlock Engine
          </h2>
        </div>
        <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
          Highest Impact Action
        </span>
      </div>

      <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-navy-900">{top.title}</h3>
          <p className="mt-1 text-xs text-slate-600 max-w-xl leading-relaxed">
            {top.description}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {top.unlockedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                <span>✓</span> Unlocks {top.unlockedCount} Scholarship{top.unlockedCount > 1 ? 's' : ''}
              </span>
            )}
            {top.resolvedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                <span>✦</span> Resolves {top.resolvedCount} Requirement{top.resolvedCount > 1 ? 's' : ''}
              </span>
            )}
            {top.affectedSchemes?.length > 0 && (
              <span className="text-xs text-slate-500">
                Affects: <em>{top.affectedSchemes.slice(0, 2).map((s) => s.name).join(', ')}{top.affectedSchemes.length > 2 ? ` +${top.affectedSchemes.length - 2} more` : ''}</em>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSimulateAction}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-all text-center flex items-center justify-center gap-1.5"
          >
            <span>🔮</span> Explore in Simulator
          </button>
          <button
            type="button"
            onClick={handleApplyDirectly}
            className="rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-50 transition-all text-center"
          >
            Apply to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
