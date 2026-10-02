import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { Spinner, ErrorBox } from '../components/Feedback';
import Disclaimer from '../components/Disclaimer';

export default function Schemes() {
  const { data, error, loading, reload } = useAsync(() => api.getSchemes(), []);
  
  // Live Sync State
  const [syncing, setSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  
  // Ingest Modal State
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestText, setIngestText] = useState('');
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState('');
  const [ingestResult, setIngestResult] = useState(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');

  const handleSyncPortals = async () => {
    setSyncing(true);
    setSyncSuccessMsg('');
    try {
      const res = await api.syncPortals();
      setSyncSuccessMsg(res.message || 'Live portals synced successfully!');
      reload();
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!ingestUrl.trim() && !ingestText.trim()) {
      setIngestError('Please enter a scholarship URL or paste notification text.');
      return;
    }
    setIngestLoading(true);
    setIngestError('');
    setIngestResult(null);
    try {
      const res = await api.ingestScheme({
        url: ingestUrl.trim() || undefined,
        textContent: ingestText.trim() || undefined
      });
      setIngestResult(res.scheme);
      reload();
    } catch (err) {
      setIngestError(err.message || 'Failed to extract and ingest scheme.');
    } finally {
      setIngestLoading(false);
    }
  };

  if (loading && !data) return <Spinner label="Connecting to scheme registry & portals…" />;
  if (error && !data) return <ErrorBox title="Could not load schemes" message={error.message} onRetry={reload} />;

  const schemes = data?.schemes || [];
  const dataset = data?.dataset || {};

  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTag === 'ALL') return matchesSearch;
    if (selectedTag === 'GOV') return matchesSearch && (s.categoryBadge?.includes('Government') || s.categoryBadge?.includes('Central') || s.categoryBadge?.includes('State'));
    if (selectedTag === 'CSR') return matchesSearch && (s.categoryBadge?.includes('CSR') || s.categoryBadge?.includes('Corporate'));
    if (selectedTag === 'AICTE') return matchesSearch && s.provider.includes('AICTE');
    if (selectedTag === 'LIVE') return matchesSearch && (s.portalSource?.includes('Live') || s.categoryBadge?.includes('Live'));
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Live Sync and Ingest actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-900">Scholarship Registry & Live Feeds</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            <strong>{dataset.datasetName || 'National Scholarship Database'}</strong> — {dataset.totalCount || schemes.length} verified schemes from official portals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncPortals}
            disabled={syncing}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-navy-800 text-white hover:bg-navy-900 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Fetch real-time updates from NSP, AICTE, MahaDBT & CSR portals"
          >
            {syncing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Syncing Portals…
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Sync Live Portals</span>
              </>
            )}
          </button>

          <button
            onClick={() => { setShowIngestModal(true); setIngestResult(null); setIngestError(''); }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>🌐</span>
            <span>Ingest Scheme by URL / Notice</span>
          </button>
        </div>
      </div>

      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
          <span>✓ {syncSuccessMsg}</span>
          <button onClick={() => setSyncSuccessMsg('')} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Verified Portal Sources Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-navy-900">Verified Feeds:</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-navy-800 font-medium">National Scholarship Portal (NSP)</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-navy-800 font-medium">AICTE Technical Schemes</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-navy-800 font-medium">MahaDBT State Portal</span>
            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-navy-800 font-medium">Reliance & Tata Trusts CSR</span>
          </div>
        </div>
        <div className="text-slate-500">
          Last Synced: <span className="font-mono text-navy-700">{dataset.lastSyncedAt ? new Date(dataset.lastSyncedAt).toLocaleTimeString() : 'Just now'}</span>
        </div>
      </div>

      <Disclaimer />

      {/* Search & Tags */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search schemes or providers…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 pl-9 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-navy-600"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {[
            { id: 'ALL', label: 'All Schemes' },
            { id: 'GOV', label: 'Government' },
            { id: 'CSR', label: 'Corporate CSR' },
            { id: 'AICTE', label: 'AICTE / Tech' },
            { id: 'LIVE', label: 'Live Ingested' }
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedTag === tag.id
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid gap-5 md:grid-cols-2">
        {filteredSchemes.map((s) => (
          <article key={s.id} className="card p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-t-4 border-t-navy-700">
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-navy-50 text-navy-800 border border-navy-200">
                  {s.categoryBadge || 'Official Scheme'}
                </span>
                {s.benefitAmount && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    💰 {s.benefitAmount}
                  </span>
                )}
              </div>

              <h2 className="font-bold text-navy-900 text-base mt-2">{s.name}</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1">
                <span>🏛️</span> {s.provider}
              </p>
              
              <p className="mt-2.5 text-xs leading-relaxed text-slate-700">{s.description}</p>

              {/* Rules Clause Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Deterministic Eligibility Rules</p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {s.eligibilityRules.map((r) => (
                    <li key={r.id} className="flex items-start gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-navy-700 bg-navy-100 px-1 py-0.5 rounded">[{r.id}]</span>
                      <span>{r.rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {s.applicationDeadline ? (
                  <span>📅 Deadline: <strong>{s.applicationDeadline}</strong></span>
                ) : (
                  <span>📅 Open for Academic Year 2026-27</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {s.officialUrl && (
                  <a
                    href={s.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-navy-900 underline"
                  >
                    Portal ↗
                  </a>
                )}
                <Link to={`/scheme/${s.id}`} className="btn-secondary text-xs py-1.5 px-3">
                  Check Criteria
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link to="/profile" className="btn-primary px-8 py-3 text-sm font-semibold shadow-md">
          🚀 Run AI + Rule Match on My Profile
        </Link>
      </div>

      {/* Modal: Live Ingestion by URL or Notice */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <h2 className="text-lg font-bold text-navy-900">Live AI Scheme Ingestor</h2>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Paste <strong>any official scholarship webpage URL</strong> or circular text. Our AI will crawl the page, extract strict mathematical criteria, income caps, and register it directly into the active system!
            </p>

            <form onSubmit={handleIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-800 mb-1">Scholarship Webpage URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://scholarships.gov.in/scheme-detail-xyz or university portal link"
                  value={ingestUrl}
                  onChange={(e) => setIngestUrl(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-800 mb-1">Or Paste Notification / Circular Text</label>
                <textarea
                  rows={4}
                  placeholder="Paste scholarship guideline text, eligibility limits, income cap, target categories..."
                  value={ingestText}
                  onChange={(e) => setIngestText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy-600"
                />
              </div>

              {ingestError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {ingestError}
                </div>
              )}

              {ingestResult && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 space-y-2">
                  <p className="font-bold">✓ Successfully Extracted & Ingested:</p>
                  <p className="font-semibold text-navy-900">{ingestResult.name}</p>
                  <p className="text-[11px]">{ingestResult.description}</p>
                  <p className="text-[11px] font-mono">Income Limit: ₹{ingestResult.incomeLimit?.toLocaleString('en-IN') || 'None'} | Rules: {ingestResult.eligibilityRules?.length}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={ingestLoading}
                  className="btn-primary text-xs py-2 px-5 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {ingestLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Extracting with AI…
                    </>
                  ) : (
                    <>⚡ Extract & Ingest Scheme</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
