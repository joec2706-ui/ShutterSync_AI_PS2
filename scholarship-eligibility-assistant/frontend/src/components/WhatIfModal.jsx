import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RuleBadge, StatusBadge } from './StatusBadge';
import { Spinner, ErrorBox } from './Feedback';

export default function WhatIfModal({ isOpen, onClose, scheme, profile, onApplyChanges }) {
  const [gapData, setGapData] = useState(null);
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Editable simulation parameters
  const [simIncome, setSimIncome] = useState(profile?.annualIncome != null ? String(profile.annualIncome) : '200000');
  const [simDomicile, setSimDomicile] = useState(profile?.domicileState || profile?.stateOfResidence || 'Maharashtra');
  const [simGender, setSimGender] = useState(profile?.gender || 'Female');
  const [simCategory, setSimCategory] = useState(profile?.category || 'OBC');

  useEffect(() => {
    if (isOpen && scheme?.id) {
      loadGapAnalysis();
    }
  }, [isOpen, scheme?.id]);

  async function loadGapAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSchemeGap(scheme.id, profile);
      setGapData(data);
      // Run initial simulation
      runSimulation({
        annualIncome: simIncome ? Number(simIncome) : null,
        domicileState: simDomicile,
        gender: simGender,
        category: simCategory
      });
    } catch (err) {
      setError(err.message || 'Could not load gap analysis.');
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation(mods) {
    try {
      const res = await api.simulateWhatIf(profile, mods, scheme.id);
      setSimResults(res);
    } catch (err) {
      console.warn('Simulation error:', err);
    }
  }

  function handleTweakChange(field, val) {
    let mods = {
      annualIncome: Number(simIncome),
      domicileState: simDomicile,
      gender: simGender,
      category: simCategory,
      [field]: val
    };
    if (field === 'annualIncome') {
      setSimIncome(val);
      mods.annualIncome = val !== '' ? Number(val) : null;
    }
    if (field === 'domicileState') {
      setSimDomicile(val);
      mods.domicileState = val;
    }
    if (field === 'gender') {
      setSimGender(val);
      mods.gender = val;
    }
    if (field === 'category') {
      setSimCategory(val);
      mods.category = val;
    }
    runSimulation(mods);
  }

  function handleOneClickPreset(patch) {
    if (patch.annualIncome != null) setSimIncome(String(patch.annualIncome));
    if (patch.domicileState != null) setSimDomicile(patch.domicileState);
    if (patch.gender != null) setSimGender(patch.gender);
    if (patch.category != null) setSimCategory(patch.category);
    runSimulation(patch);
  }

  if (!isOpen) return null;

  const targetComparison = simResults?.comparison?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-sm">
              🔮
            </span>
            <div>
              <h2 className="text-base font-bold text-navy-900">What-If Eligibility Simulator</h2>
              <p className="text-xs text-slate-500">{scheme?.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs text-purple-950">
            <p className="font-semibold text-purple-900">💡 Understanding Scheme Rules via Simulation</p>
            <p className="mt-1 text-purple-800 leading-relaxed">
              Test how changes to reported family income, domicile, category or gender would affect eligibility for this scheme.
              <em> (Note: For educational/decision simulation only).</em>
            </p>
          </div>

          {loading && <Spinner label="Analyzing eligibility gaps…" />}
          {error && <ErrorBox title="Error" message={error} />}

          {/* Quick Resolution Buttons for Blocked Rules */}
          {gapData && gapData.gaps?.filter(g => !g.isResolved).length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Identified Rule Blockers &amp; Quick Fixes:
              </p>
              <div className="space-y-2">
                {gapData.gaps.filter(g => !g.isResolved).map(gap => (
                  <div key={gap.ruleId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div>
                      <span className="font-bold text-navy-800">[{gap.ruleId}]</span>{' '}
                      <span className="text-slate-700">{gap.ruleText}</span>
                      <p className="mt-1 font-medium text-amber-800">{gap.resolutionSuggestion}</p>
                    </div>
                    {Object.keys(gap.patchPayload || {}).length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOneClickPreset(gap.patchPayload)}
                        className="rounded-lg bg-white border border-purple-300 px-3 py-1.5 font-bold text-purple-700 shadow-2xs hover:bg-purple-50 shrink-0 self-start sm:self-auto"
                      >
                        ⚡ Simulate Rule Pass
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Sliders / Inputs */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Simulate Variable Adjustments:
            </h3>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <label htmlFor="modal-sim-income">Simulated Annual Family Income: <strong className="text-navy-900">₹{Number(simIncome || 0).toLocaleString('en-IN')}</strong></label>
                {scheme?.incomeLimit && (
                  <span className="text-slate-500">Scheme Cap: ₹{scheme.incomeLimit.toLocaleString('en-IN')}</span>
                )}
              </div>
              <input
                id="modal-sim-income"
                type="range"
                min="0"
                max="800000"
                step="25000"
                value={simIncome || 0}
                onChange={(e) => handleTweakChange('annualIncome', e.target.value)}
                className="w-full mt-2 cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₹0 (Nil)</span>
                <span>₹2.5L</span>
                <span>₹5.0L</span>
                <span>₹8.0L+</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="label text-[11px]">Domicile State</label>
                <select
                  value={simDomicile}
                  onChange={(e) => handleTweakChange('domicileState', e.target.value)}
                  className="input text-xs py-1.5"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Other">Other State</option>
                </select>
              </div>

              <div>
                <label className="label text-[11px]">Gender</label>
                <select
                  value={simGender}
                  onChange={(e) => handleTweakChange('gender', e.target.value)}
                  className="input text-xs py-1.5"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Card */}
          {targetComparison && (
            <div className={`rounded-xl border p-4 transition-all ${
              targetComparison.isUnlocked
                ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
                : targetComparison.statusAfter === 'ELIGIBLE'
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-slate-300 bg-slate-100/70'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Simulated Outcome</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 line-through">
                    <StatusBadge status={targetComparison.statusBefore} size="sm" />
                  </span>
                  <span>➜</span>
                  <StatusBadge status={targetComparison.statusAfter} size="md" />
                </div>
              </div>

              <p className="mt-2 text-xs font-medium text-slate-800">
                {targetComparison.afterSummary}
              </p>

              {/* Rule differences */}
              <div className="mt-3 space-y-1.5 border-t border-slate-200/60 pt-2 text-xs">
                {targetComparison.ruleDiffs?.map(rd => (
                  <div key={rd.ruleId} className="flex items-center justify-between">
                    <span className="text-slate-700">[{rd.ruleId}] {rd.rule}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {rd.before.result !== rd.after.result ? (
                        <>
                          <RuleBadge result={rd.before.result} />
                          <span className="text-[10px]">➜</span>
                          <RuleBadge result={rd.after.result} />
                        </>
                      ) : (
                        <RuleBadge result={rd.after.result} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (onApplyChanges) {
                onApplyChanges({
                  annualIncome: Number(simIncome),
                  domicileState: simDomicile,
                  gender: simGender,
                  category: simCategory
                });
              }
              onClose();
            }}
            className="btn-primary text-xs font-semibold py-2 px-4"
          >
            Apply Simulated Values to Profile
          </button>
        </div>
      </div>
    </div>
  );
}
