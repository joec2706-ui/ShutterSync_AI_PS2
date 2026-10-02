import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SchemeCard from '../components/SchemeCard';
import ModeBanner from '../components/ModeBanner';
import ConflictBanner from '../components/ConflictBanner';
import OpportunityUnlockWidget from '../components/OpportunityUnlockWidget';
import Disclaimer from '../components/Disclaimer';
import { EmptyState } from '../components/Feedback';
import { STATUS } from '../utils/constants';

const ORDER = { ELIGIBLE: 0, NEEDS_MORE_INFORMATION: 1, NOT_ELIGIBLE: 2 };
const FILTERS = [
  ['ALL', 'All'],
  ['ELIGIBLE', 'Eligible'],
  ['NEEDS_MORE_INFORMATION', 'Needs information'],
  ['NOT_ELIGIBLE', 'Not eligible']
];

export default function Results() {
  const { results, isShortlisted, toggleShortlist } = useApp();
  const [filter, setFilter] = useState('ALL');

  const list = useMemo(() => {
    if (!results) return [];
    return [...results.results]
      .filter((r) => filter === 'ALL' || r.status === filter)
      .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  }, [results, filter]);

  if (!results) {
    return (
      <EmptyState
        title="No results yet"
        message="Enter your profile first and we'll check it against every scheme."
      >
        <Link to="/profile" className="btn-primary">Enter my profile</Link>
      </EmptyState>
    );
  }

  const c = results.counts;
  const cards = [
    ['ELIGIBLE', c.ELIGIBLE, 'border-emerald-600 bg-emerald-50/40 text-emerald-950'],
    ['NOT_ELIGIBLE', c.NOT_ELIGIBLE, 'border-red-600 bg-red-50/40 text-red-950'],
    ['NEEDS_MORE_INFORMATION', c.NEEDS_MORE_INFORMATION, 'border-amber-600 bg-amber-50/40 text-amber-950']
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Eligibility Results</h1>
          <p className="text-sm text-slate-600">
            {results.dataset} · {results.results.length} schemes evaluated with exact clause citations
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/simulator" className="btn-secondary flex items-center gap-1.5 text-xs font-semibold">
            <span>🔮</span> What-If Simulator
          </Link>
          <Link to="/profile" className="btn-ghost text-xs">Edit profile</Link>
        </div>
      </div>

      {/* AI Mode Banner */}
      <ModeBanner mode={results.mode} reason={results.fallbackReason} />

      {/* Conflict Banner if Document discrepancies exist */}
      <ConflictBanner />

      {/* Opportunity Unlock Engine Highlight */}
      <OpportunityUnlockWidget />

      {/* Metric Counts */}
      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-3">
        {cards.map(([k, n, border]) => (
          <div key={k} className={`card border-l-4 p-4 shadow-2xs ${border}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {STATUS[k].short}
            </p>
            <p className="text-3xl font-bold text-navy-900 mt-1">{n}</p>
          </div>
        ))}
      </section>

      {/* Filters */}
      <div role="group" aria-label="Filter results" className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === k
                  ? 'border-navy-800 bg-navy-800 text-white shadow-xs'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-navy-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      {list.length === 0 ? (
        <p className="card p-6 text-center text-sm text-slate-600">No schemes in this category.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => (
            <SchemeCard
              key={r.schemeId}
              evaluation={r}
              saved={isShortlisted(r.schemeId)}
              onToggleSave={toggleShortlist}
            />
          ))}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
