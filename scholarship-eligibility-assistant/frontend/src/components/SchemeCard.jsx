import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';

export default function SchemeCard({ evaluation: e, saved, onToggleSave }) {
  const key = e.citations && e.citations[0];
  return (
    <article className="card flex flex-col p-5" aria-labelledby={`t-${e.schemeId}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id={`t-${e.schemeId}`} className="text-base font-semibold text-navy-900">{e.schemeName}</h3>
          <p className="text-xs text-slate-500">{e.provider}</p>
        </div>
        <StatusBadge status={e.status} />
      </div>

      <p className="mt-3 text-sm text-slate-700">{e.summary}</p>

      {key && (
        <blockquote className="mt-3 rounded-lg border-l-4 border-navy-400 bg-navy-50 px-3 py-2 text-sm text-navy-900">
          <span className="font-semibold">[{key.ruleId}]</span> {key.quotedRule}
        </blockquote>
      )}

      {e.missingInformation.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-amber-900">Missing information</p>
          <ul className="ml-5 list-disc text-slate-700">
            {e.missingInformation.map((m) => <li key={m.field}>{m.field}{m.question ? <span className="text-slate-500"> — {m.question}</span> : null}</li>)}
          </ul>
        </div>
      )}

      {e.missingDocuments.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-slate-800">Documents still needed</p>
          <p className="text-slate-700">{e.missingDocuments.join(', ')}</p>
        </div>
      )}

      {e.nextSteps.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="font-semibold text-slate-800">Next step</p>
          <p className="text-slate-700">{e.nextSteps[0]}</p>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link to={`/scheme/${e.schemeId}`} className="btn-primary">View Details</Link>
        <button type="button" onClick={() => onToggleSave(e)} aria-pressed={saved} className="btn-secondary">
          {saved ? '★ Saved' : '☆ Save to shortlist'}
        </button>
      </div>
    </article>
  );
}
