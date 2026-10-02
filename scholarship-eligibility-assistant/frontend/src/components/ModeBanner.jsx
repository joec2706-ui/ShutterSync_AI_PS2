export default function ModeBanner({ mode, reason }) {
  if (mode === 'gemini') {
    return (
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs text-indigo-900 flex items-center justify-between">
        <div>
          <strong className="text-indigo-950 font-bold">⚡ Hybrid Gemini AI + Deterministic Verification.</strong> Decisions are semantically reasoned by Gemini and cross-verified against official portal rule limits with 0% hallucination risk.
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">Active</span>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 flex items-center justify-between">
      <div>
        <strong className="text-navy-950 font-bold">🛡️ Deterministic Rule Engine Verification.</strong>{' '}
        {mode === 'mixed'
          ? 'Cross-validated against official portal criteria.'
          : 'High-precision mathematical eligibility check against official government rules.'}
        {reason ? ` (${reason})` : ''}
      </div>
      <span className="hidden sm:inline-block px-2 py-0.5 bg-navy-800 text-white rounded text-[10px] font-bold">Audited</span>
    </div>
  );
}

