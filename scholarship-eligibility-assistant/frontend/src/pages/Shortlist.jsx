import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/Feedback';
import Disclaimer from '../components/Disclaimer';

export default function Shortlist() {
  const { shortlist, removeFromShortlist } = useApp();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-900">My Shortlist</h1>
      {shortlist.length === 0 ? (
        <EmptyState title="Your shortlist is empty" message="Save schemes from your results to keep track of the ones you want to apply for.">
          <Link to="/results" className="btn-primary">View results</Link>
          <Link to="/schemes" className="btn-secondary">Explore schemes</Link>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {shortlist.map((s) => (
            <li key={s.schemeId} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-semibold text-navy-900">{s.name}</h2>
                <p className="text-xs text-slate-500">{s.provider}</p>
                {s.status && <div className="mt-2"><StatusBadge status={s.status} /></div>}
              </div>
              <div className="flex gap-2">
                <Link to={`/scheme/${s.schemeId}`} className="btn-primary">View Details</Link>
                <button type="button" className="btn-secondary" onClick={() => removeFromShortlist(s.schemeId)} aria-label={`Remove ${s.name} from shortlist`}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Disclaimer />
    </div>
  );
}
