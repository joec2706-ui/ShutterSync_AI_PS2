import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ErrorBox } from './Feedback';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, switchDemoUser } = useApp();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoSwitch(demoEmail) {
    setError(null);
    setLoading(true);
    try {
      await switchDemoUser(demoEmail);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`pb-1 text-base font-semibold transition-colors ${
                tab === 'login' ? 'border-b-2 border-navy-800 text-navy-900' : 'text-slate-500 hover:text-navy-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`pb-1 text-base font-semibold transition-colors ${
                tab === 'register' ? 'border-b-2 border-navy-800 text-navy-900' : 'text-slate-500 hover:text-navy-700'
              }`}
            >
              Create Account
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          {tab === 'login'
            ? 'Access your saved eligibility results, documents wallet, and shortlists.'
            : 'Create your free account to store your profile and verify documents.'}
        </p>

        {error && (
          <div className="mt-3">
            <ErrorBox title="Authentication Error" message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {tab === 'register' && (
            <div>
              <label className="label text-xs">Full Name</label>
              <input
                type="text"
                required
                className="input text-sm"
                placeholder="e.g. Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="label text-xs">Email Address</label>
            <input
              type="email"
              required
              className="input text-sm"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label text-xs">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 mt-2 justify-center text-sm font-semibold"
          >
            {loading ? 'Processing…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">⚡ Quick 1-Click Demo Accounts (Judges &amp; Testing):</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSwitch('demo@scholarship.org')}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-navy-50 hover:border-navy-300 transition-all text-xs"
            >
              <span className="font-semibold block text-navy-900">Aarav Sharma</span>
              <span className="text-[10px] text-slate-500">OBC • ₹2.0L • Maharashtra</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoSwitch('priya@scholarship.org')}
              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-left hover:bg-navy-50 hover:border-navy-300 transition-all text-xs"
            >
              <span className="font-semibold block text-navy-900">Priya Patel</span>
              <span className="text-[10px] text-slate-500">General • ₹4.5L • Gujarat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
