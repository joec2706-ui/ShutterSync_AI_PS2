import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { CATEGORIES, COURSE_LEVELS, GENDERS, STATES } from '../utils/constants';
import { StatusBadge } from '../components/StatusBadge';
import { Spinner, ErrorBox } from '../components/Feedback';
import Disclaimer from '../components/Disclaimer';

export default function Simulator() {
  const { profile, setProfile } = useApp();

  const [simIncome, setSimIncome] = useState(
    profile.annualIncome != null ? String(profile.annualIncome) : '200000'
  );
  const [simState, setSimState] = useState(profile.stateOfResidence || 'Maharashtra');
  const [simDomicile, setSimDomicile] = useState(profile.domicileState || profile.stateOfResidence || 'Maharashtra');
  const [simCategory, setSimCategory] = useState(profile.category || 'OBC');
  const [simGender, setSimGender] = useState(profile.gender || 'Female');
  const [simCourse, setSimCourse] = useState(profile.course || 'B.E. Computer Engineering');
  const [simLevel, setSimLevel] = useState(profile.courseLevel || 'Undergraduate');
  const [simYear, setSimYear] = useState(profile.yearOfStudy ? String(profile.yearOfStudy) : '3');
  const [simDisability, setSimDisability] = useState(profile.disability || 'No');
  
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    runBatchSimulation();
  }, [simIncome, simState, simDomicile, simCategory, simGender, simCourse, simLevel, simYear, simDisability]);

  async function runBatchSimulation() {
    setLoading(true);
    setError(null);
    try {
      const modifications = {
        annualIncome: simIncome !== '' ? Number(simIncome) : null,
        stateOfResidence: simState,
        domicileState: simDomicile,
        category: simCategory,
        gender: simGender,
        course: simCourse,
        courseLevel: simLevel,
        yearOfStudy: Number(simYear) || 1,
        disability: simDisability
      };
      const res = await api.simulateWhatIf(profile, modifications);
      setSimResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleApplyAll() {
    setProfile((prev) => ({
      ...prev,
      annualIncome: simIncome !== '' ? Number(simIncome) : null,
      stateOfResidence: simState,
      domicileState: simDomicile,
      category: simCategory,
      gender: simGender,
      course: simCourse,
      courseLevel: simLevel,
      yearOfStudy: Number(simYear) || 1,
      disability: simDisability
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-lg shadow-sm">
              🔮
            </span>
            <h1 className="text-2xl font-bold text-navy-900">What-If Eligibility Simulator</h1>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Simulate how eligibility changes across all verified national, state, and corporate scholarship schemes in real-time when household, income, or academic parameters shift.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApplyAll}
            className="btn-primary text-xs font-semibold"
          >
            Save Simulated Values to Profile
          </button>
          <Link to="/results" className="btn-secondary text-xs">
            View Current Results
          </Link>
        </div>
      </div>

      {error && <ErrorBox title="Simulation Error" message={error} />}

      {/* Simulator Control Board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Column */}
        <div className="card p-5 space-y-4 lg:col-span-1 border-purple-200 bg-gradient-to-b from-purple-50/40 via-white to-white">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-950 flex items-center justify-between">
            <span>⚙️ Simulation Parameters</span>
            {loading && <span className="text-[10px] text-purple-600 animate-pulse font-normal">Updating…</span>}
          </h2>

          {/* Income Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <label htmlFor="simulator-income-range">Family Income (Annual)</label>
              <span className="text-purple-700 font-bold text-sm">
                ₹{Number(simIncome || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <input
              id="simulator-income-range"
              type="range"
              min="0"
              max="1000000"
              step="25000"
              value={simIncome || 0}
              onChange={(e) => setSimIncome(e.target.value)}
              className="w-full mt-2 cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹0</span>
              <span>₹2.5L</span>
              <span>₹5L</span>
              <span>₹10L</span>
            </div>
          </div>

          {/* Domicile State */}
          <div>
            <label className="label text-xs">State of Domicile</label>
            <select
              value={simDomicile}
              onChange={(e) => setSimDomicile(e.target.value)}
              className="input text-xs"
            >
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* State of Residence */}
          <div>
            <label className="label text-xs">State of Residence</label>
            <select
              value={simState}
              onChange={(e) => setSimState(e.target.value)}
              className="input text-xs"
            >
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label text-xs">Social Category</label>
            <select
              value={simCategory}
              onChange={(e) => setSimCategory(e.target.value)}
              className="input text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="label text-xs">Gender</label>
            <select
              value={simGender}
              onChange={(e) => setSimGender(e.target.value)}
              className="input text-xs"
            >
              {GENDERS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Course Keyword */}
          <div>
            <label className="label text-xs">Course Name</label>
            <input
              type="text"
              value={simCourse}
              onChange={(e) => setSimCourse(e.target.value)}
              className="input text-xs"
              placeholder="e.g. B.Tech Computer Science"
            />
          </div>

          {/* Level & Year */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label text-xs">Course Level</label>
              <select
                value={simLevel}
                onChange={(e) => setSimLevel(e.target.value)}
                className="input text-xs"
              >
                {COURSE_LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label text-xs">Year of Study</label>
              <select
                value={simYear}
                onChange={(e) => setSimYear(e.target.value)}
                className="input text-xs"
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Disability Status */}
          <div>
            <label className="label text-xs">Disability Status (PwD)</label>
            <select
              value={simDisability}
              onChange={(e) => setSimDisability(e.target.value)}
              className="input text-xs"
            >
              <option value="No">No</option>
              <option value="Yes">Yes (Certified Disability)</option>
            </select>
          </div>
        </div>

        {/* Results & Live Diffs Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Summary Stat Cards */}
          {simResult && (
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 border-l-4 border-emerald-500 bg-emerald-50/40">
                <p className="text-xs font-semibold text-slate-600">Simulated Eligible</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-navy-900">
                    {simResult.summary.afterCounts.ELIGIBLE}
                  </span>
                  {simResult.summary.netGain !== 0 && (
                    <span className={`text-xs font-bold ${
                      simResult.summary.netGain > 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      ({simResult.summary.netGain > 0 ? `+${simResult.summary.netGain}` : simResult.summary.netGain})
                    </span>
                  )}
                </div>
              </div>

              <div className="card p-4 border-l-4 border-amber-500 bg-amber-50/40">
                <p className="text-xs font-semibold text-slate-600">Needs Info</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">
                  {simResult.summary.afterCounts.NEEDS_MORE_INFORMATION}
                </p>
              </div>

              <div className="card p-4 border-l-4 border-red-500 bg-red-50/40">
                <p className="text-xs font-semibold text-slate-600">Not Eligible</p>
                <p className="text-2xl font-bold text-navy-900 mt-1">
                  {simResult.summary.afterCounts.NOT_ELIGIBLE}
                </p>
              </div>
            </div>
          )}

          {/* Unlocked Schemes Alert */}
          {simResult?.summary?.newlyEligibleCount > 0 && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="text-sm font-bold">
                    {simResult.summary.newlyEligibleCount} Scholarship{simResult.summary.newlyEligibleCount > 1 ? 's' : ''} Unlocked!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Under these simulated conditions, you now qualify for: {simResult.newlyEligibleSchemes.map(s => s.name).join(', ')}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scheme Comparison List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Scheme-by-Scheme Live Simulation Breakdown:
            </h3>

            {simResult?.comparison?.map((comp) => {
              const changed = comp.statusBefore !== comp.statusAfter;
              return (
                <div
                  key={comp.schemeId}
                  className={`card p-4 transition-all ${
                    comp.isUnlocked
                      ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-400'
                      : changed
                      ? 'border-purple-300 bg-purple-50/20'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="font-bold text-navy-900 text-sm">{comp.schemeName}</h4>
                      <p className="text-xs text-slate-500">{comp.provider}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {comp.statusBefore}
                      </span>
                      <span>➜</span>
                      <StatusBadge status={comp.statusAfter} size="sm" />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-700 leading-relaxed">
                    {comp.afterSummary}
                  </p>

                  {/* Improved or failed rule breakdown */}
                  {comp.ruleDiffs?.some(r => r.improved || r.worsened) && (
                    <div className="mt-2 rounded-lg bg-white p-2.5 border border-slate-100 space-y-1 text-xs">
                      {comp.ruleDiffs.filter(r => r.improved || r.worsened).map(rd => (
                        <div key={rd.ruleId} className="flex items-center justify-between">
                          <span className="text-slate-600">[{rd.ruleId}] {rd.rule}</span>
                          <span className={`text-[11px] font-bold ${rd.improved ? 'text-emerald-700' : 'text-red-600'}`}>
                            {rd.improved ? '✓ Now PASS' : '✕ Now FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Link
                      to={`/scheme/${comp.schemeId}`}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      View Full Scheme Details →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
