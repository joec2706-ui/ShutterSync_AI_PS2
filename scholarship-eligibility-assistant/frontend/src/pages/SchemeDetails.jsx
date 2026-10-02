import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { toPayload, validateForm } from '../utils/profile';
import { Spinner, ErrorBox } from '../components/Feedback';
import { RuleBadge, StatusBadge } from '../components/StatusBadge';
import ModeBanner from '../components/ModeBanner';
import ConflictBanner from '../components/ConflictBanner';
import WhatIfModal from '../components/WhatIfModal';
import Disclaimer from '../components/Disclaimer';

export default function SchemeDetails() {
  const { id } = useParams();
  const { profile, setProfile, results, isShortlisted, toggleShortlist } = useApp();
  const { data, error, loading, reload } = useAsync(() => api.getScheme(id), [id]);
  const [single, setSingle] = useState(null);
  const [evalState, setEvalState] = useState({ busy: false, error: null });
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  if (loading) return <Spinner label="Loading scheme…" />;
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorBox
          title={error.code === 'SCHEME_NOT_FOUND' ? 'Scheme not found' : 'Could not load scheme'}
          message={error.message}
          onRetry={error.code === 'SCHEME_NOT_FOUND' ? undefined : reload}
        />
        <Link to="/schemes" className="btn-secondary">Back to schemes</Link>
      </div>
    );
  }

  const scheme = data.scheme;
  const ev = single || results?.results.find((r) => r.schemeId === id) || null;
  const profileReady = Object.keys(validateForm(profile)).length === 0;

  async function evaluateNow() {
    setEvalState({ busy: true, error: null });
    try {
      const out = await api.evaluate(toPayload(profile), id);
      setSingle(out.evaluation);
      setEvalState({ busy: false, error: null });
    } catch (e) {
      setEvalState({ busy: false, error: e.message });
    }
  }

  function handleApplySimulatedChanges(changes) {
    setProfile((prev) => ({
      ...prev,
      ...changes
    }));
    // Re-evaluate
    setTimeout(() => {
      evaluateNow();
    }, 100);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={results ? '/results' : '/schemes'} className="text-xs font-semibold text-navy-700 hover:underline">
        ← Back to {results ? 'Results' : 'Schemes'}
      </Link>

      <ConflictBanner />

      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{scheme.name}</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{scheme.provider}</p>
          </div>
          {ev && (
            <button
              type="button"
              onClick={() => setWhatIfOpen(true)}
              className="rounded-xl border border-purple-300 bg-purple-50 px-3.5 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-100 shadow-2xs transition-all flex items-center gap-1.5"
            >
              <span>🔮</span> Explore What-If
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-700 leading-relaxed">{scheme.description}</p>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2 text-slate-600">
          <div>
            <dt className="inline font-semibold text-navy-900">Application deadline: </dt>
            <dd className="inline">{scheme.applicationDeadline || 'Open for Academic Year 2026-27 (Official Portal Verification)'}</dd>
          </div>
          {scheme.officialUrl && (
            <div>
              <dt className="inline font-semibold text-navy-900">Official portal: </dt>
              <dd className="inline">
                <a className="text-blue-700 underline" href={scheme.officialUrl} target="_blank" rel="noopener noreferrer">
                  {scheme.officialUrl.replace('https://', '')}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </header>

      {ev ? (
        <>
          {/* Decision Card */}
          <section className="card p-5 border-l-4 border-l-indigo-600" aria-labelledby="decision">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="decision" className="text-base font-bold text-navy-900">Eligibility Decision</h2>
              <StatusBadge status={ev.status} size="lg" />
            </div>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Why this decision was made</h3>
            <p className="mt-1 text-sm text-slate-800 leading-relaxed">{ev.summary}</p>
            <p className="mt-2 text-xs text-slate-500">
              Confidence: <strong>{ev.confidence}</strong> · {ev.meta?.label}
              {ev.meta?.fallbackReason ? ` (${ev.meta.fallbackReason})` : ''}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                aria-pressed={isShortlisted(ev.schemeId)}
                onClick={() => toggleShortlist(ev)}
              >
                {isShortlisted(ev.schemeId) ? '★ Saved to shortlist' : '☆ Save to shortlist'}
              </button>
              <button
                type="button"
                onClick={() => setWhatIfOpen(true)}
                className="btn-ghost text-xs border border-purple-200 bg-purple-50/50 text-purple-900 hover:bg-purple-100"
              >
                🔮 Simulate Different Scenario
              </button>
            </div>
          </section>

          {/* Rule-by-rule evaluation */}
          <section className="card p-5" aria-labelledby="rules">
            <h2 id="rules" className="text-base font-bold text-navy-900">Rule-by-rule Evaluation</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {ev.reasoning.map((r) => (
                <li key={r.ruleId} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-navy-800 text-xs">[{r.ruleId}]</span>
                    <RuleBadge result={r.result} />
                  </div>
                  <p className="mt-1 text-xs"><span className="font-semibold text-slate-800">Rule Clause:</span> {r.rule}</p>
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">{r.explanation}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Citations */}
          <section className="card p-5" aria-labelledby="cit">
            <h2 id="cit" className="text-base font-bold text-navy-900">Exact Deciding Rule Citations</h2>
            <ul className="mt-3 space-y-2.5">
              {ev.citations.map((c) => (
                <li key={c.ruleId} className="rounded-xl border-l-4 border-navy-600 bg-navy-50/70 p-3 text-xs">
                  <p className="font-bold text-navy-950">[{c.ruleId}] {c.quotedRule}</p>
                  {c.explanation && <p className="mt-1 text-slate-700 leading-relaxed">{c.explanation}</p>}
                </li>
              ))}
            </ul>
          </section>

          {/* Missing Information */}
          {ev.missingInformation.length > 0 && (
            <section className="card p-5 border-amber-200 bg-amber-50/30" aria-labelledby="mi">
              <h2 id="mi" className="text-base font-bold text-amber-950">Missing Information Needed</h2>
              <ul className="mt-2 space-y-2 text-xs">
                {ev.missingInformation.map((m) => (
                  <li key={m.field} className="rounded-lg bg-white p-2.5 border border-amber-200">
                    <span className="font-bold text-navy-900">{m.field}</span>
                    <p className="text-slate-600 mt-0.5">Question to answer: <em>“{m.question}”</em></p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Missing Documents */}
          {ev.missingDocuments.length > 0 && (
            <section className="card p-5" aria-labelledby="md">
              <h2 id="md" className="text-base font-bold text-navy-900">Required Documents</h2>
              <ul className="ml-5 mt-2 list-disc text-xs text-slate-700 space-y-1">
                {ev.missingDocuments.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              <div className="mt-3">
                <Link to="/wallet" className="text-xs font-semibold text-teal-700 hover:underline">
                  Go to Evidence Wallet to upload certificates →
                </Link>
              </div>
            </section>
          )}

          {/* Next Steps */}
          <section className="card p-5" aria-labelledby="ns">
            <h2 id="ns" className="text-base font-bold text-navy-900">Actionable Next Steps</h2>
            <ul className="ml-5 mt-2 list-disc text-xs text-slate-700 space-y-1">
              {ev.nextSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <>
          <section className="card p-5">
            <h2 className="text-base font-bold text-navy-900">Eligibility Rules</h2>
            <ul className="mt-3 space-y-2 text-xs">
              {scheme.eligibilityRules.map((r) => (
                <li key={r.id} className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                  <span className="font-bold text-navy-800">[{r.id}]</span> {r.rule}
                </li>
              ))}
            </ul>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Required Documents</h3>
            <p className="text-xs text-slate-700 mt-1">{scheme.requiredDocuments.map((d) => d.label).join(', ')}</p>
          </section>

          <section className="card p-6 text-center">
            <p className="text-sm text-slate-700">No decision yet for this scheme with your current profile.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {profileReady ? (
                <button
                  type="button"
                  className="btn-primary text-xs font-semibold py-2.5 px-5"
                  onClick={evaluateNow}
                  disabled={evalState.busy}
                >
                  {evalState.busy ? 'Evaluating with AI…' : 'Check My Eligibility for this Scheme'}
                </button>
              ) : (
                <Link to="/profile" className="btn-primary text-xs font-semibold">Enter My Profile</Link>
              )}
            </div>
            {evalState.error && (
              <div className="mt-3 text-left">
                <ErrorBox title="Could not evaluate" message={evalState.error} />
              </div>
            )}
          </section>
        </>
      )}

      {ev?.meta && <ModeBanner mode={ev.meta.mode} reason={ev.meta.fallbackReason} />}
      <Disclaimer />

      {/* What-If Simulation Modal */}
      <WhatIfModal
        isOpen={whatIfOpen}
        onClose={() => setWhatIfOpen(false)}
        scheme={scheme}
        profile={profile}
        onApplyChanges={handleApplySimulatedChanges}
      />
    </div>
  );
}
