import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import Disclaimer from '../components/Disclaimer';

const features = [
  {
    icon: '🔮',
    title: 'What-If Eligibility Simulator',
    text: 'Do not just accept a "Not Eligible" verdict. Simulate what changes if family income, domicile state, category, or gender requirements change.'
  },
  {
    icon: '🎯',
    title: 'Opportunity Unlock Engine',
    text: 'Identifies the single highest-impact missing document or certificate that unlocks the maximum scholarship funding.'
  },
  {
    icon: '📁',
    title: 'Evidence Wallet & Conflict Detector',
    text: 'Audit cross-document discrepancies across Aadhaar, Income Certificate, and Marksheets to prevent government application rejections.'
  },
  {
    icon: '🔄',
    title: 'Live Portal Sync & Web Ingestor',
    text: 'Real-time synchronization with National Scholarship Portal (NSP), AICTE, MahaDBT, plus AI extraction for any external scholarship URL.'
  }
];

const vsGptPoints = [
  {
    topic: 'Deterministic Accuracy vs Hallucination',
    gpt: 'Generic LLMs hallucinate income cutoffs, outdated quota dates, and wrong reservation percentages.',
    ourApp: 'Hybrid Architecture: Strict mathematical rule engine guarantees 100% verified income & quota validation.'
  },
  {
    topic: 'Cross-Document Conflict Audit',
    gpt: 'Cannot detect discrepancies between an uploaded Tehsildar Income Certificate vs. declared profile figures.',
    ourApp: 'Evidence Vault audits document OCR data and flags mismatches that cause government rejections.'
  },
  {
    topic: 'What-If Unlocking Engine',
    gpt: 'Only gives static textual answers without dynamic scenario recalculation or financial impact trees.',
    ourApp: 'Calculates exact unlock paths: e.g. "Obtaining an EWS certificate immediately unlocks ₹1,50,000 in funding".'
  },
  {
    topic: 'Duplicate Benefit & Conflict Warning',
    gpt: 'Does not know government rules prohibiting simultaneous Central Sector scholarships.',
    ourApp: 'Detects regulatory scheme conflicts and optimizes maximum payout selection.'
  }
];

export default function Landing() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="grid items-center gap-10 lg:grid-cols-2 pt-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-900 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live NSP &amp; AICTE Portal Synced</span>
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-navy-900 sm:text-5xl">
            Scholarship &amp; Welfare <span className="text-indigo-600">Eligibility Intelligence</span>
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
            More than just a search filter. An end-to-end decision intelligence platform that audits documents for discrepancies, guarantees zero-hallucination rule validation, and runs <strong>What-If simulations</strong> to unlock maximum financial aid.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/profile" className="btn-primary px-6 py-3 text-sm font-bold shadow-md">
              🚀 Check My Eligibility
            </Link>
            <Link to="/simulator" className="btn-secondary px-6 py-3 text-sm font-bold border border-purple-300 bg-purple-50 text-purple-900 hover:bg-purple-100">
              <span>🔮</span> What-If Simulator
            </Link>
            <Link to="/schemes" className="btn-ghost px-4 py-3 text-sm font-semibold">
              Explore Live Schemes (14+)
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-500 flex items-center gap-2">
            <span className="font-semibold text-navy-900">Active Engine:</span>
            <span>Deterministic Rule Verification + Gemini AI Semantic Matcher</span>
          </p>
        </div>

        {/* Live Feature Preview Card */}
        <div className="card p-6 border-indigo-100 shadow-xl bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30" aria-label="Example of a decision">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-900">Live Decision &amp; Simulation Engine</p>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">Verified NSP Scheme</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-navy-900 text-sm">PM-USP Central Sector College Scholarship</h2>
                <StatusBadge status="NOT_ELIGIBLE" size="sm" />
              </div>
              <p className="mt-1 text-xs text-slate-700">
                Annual family income is ₹5,20,000, which exceeds the ₹4,50,000 government threshold.
              </p>
              <blockquote className="mt-2 rounded-lg border-l-4 border-navy-600 bg-navy-50/70 px-3 py-1.5 text-xs text-navy-950 font-medium">
                [R1] Gross annual family income must not exceed ₹4,50,000.
              </blockquote>
            </div>

            {/* Interactive Simulation Callout */}
            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">🔮 What-If Simulation Result:</span>
                <span className="font-bold text-emerald-700">➜ Unlocks ₹20,000/yr</span>
              </div>
              <p className="mt-1 text-purple-950 text-[11px]">
                If verified family income is corrected to ≤ ₹4,50,000 via Tehsildar certificate, status shifts to <strong>ELIGIBLE</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why ScholarshipAI vs Generic ChatGPT / Claude Section */}
      <section className="bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-3">
            The Competitive Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Why Not Just Ask ChatGPT or Claude?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2">
            General LLMs answer questions in plain text, but cannot perform algorithmic financial decision-making or audit official government documents.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {vsGptPoints.map((p, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
              <h3 className="font-bold text-indigo-300 text-sm mb-3 flex items-center gap-2">
                <span>⚡</span> {p.topic}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200">
                  <span className="font-bold block text-[11px] text-red-400 uppercase">Standard LLMs (ChatGPT/Claude):</span>
                  {p.gpt}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200">
                  <span className="font-bold block text-[11px] text-emerald-400 uppercase">ScholarshipAI Intelligence Engine:</span>
                  {p.ourApp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section aria-labelledby="features-heading" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 id="features-heading" className="text-2xl font-bold text-navy-900 sm:text-3xl">
            Complete Decision-Support Platform Architecture
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Engineered to maximize student scholarship access with transparency, evidence verification, and actionable simulation.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card p-5 border-slate-200 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <span className="text-3xl block mb-3">{f.icon}</span>
                <h3 className="font-bold text-navy-900 text-base">{f.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}
