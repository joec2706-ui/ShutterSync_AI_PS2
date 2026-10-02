import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import AuthModal from './AuthModal';
import ChatDrawer from './ChatDrawer';

const nav = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
    isActive ? 'bg-navy-100 text-navy-900 font-bold' : 'text-navy-700 hover:bg-navy-50'
  }`;

export default function Layout() {
  const { shortlist, user, logout, conflicts } = useApp();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/40 text-slate-800 antialiased">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 font-bold text-navy-900">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-navy-900 to-indigo-700 text-sm font-extrabold text-white shadow-xs"
            >
              SE
            </span>
            <span className="text-sm sm:text-base tracking-tight font-extrabold text-navy-900">
              Scholarship<span className="text-indigo-600">AI</span>
            </span>
          </Link>

          {/* Navigation links */}
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
            <NavLink to="/schemes" className={nav}>Schemes</NavLink>
            <NavLink to="/profile" className={nav}>My Profile</NavLink>
            <NavLink to="/results" className={nav}>Results</NavLink>
            <NavLink to="/simulator" className={nav}>
              <span className="flex items-center gap-1">
                <span>🔮</span> What-If
              </span>
            </NavLink>
            <NavLink to="/wallet" className={nav}>
              <span className="flex items-center gap-1 relative">
                <span>📁</span> Wallet
                {conflicts.length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" title="Conflicts detected"></span>
                )}
              </span>
            </NavLink>
            <NavLink to="/shortlist" className={nav}>
              Shortlist
              {shortlist.length > 0 && (
                <span className="ml-1.5 rounded-full bg-navy-800 px-1.5 py-0.2 text-[11px] text-white">
                  {shortlist.length}
                </span>
              )}
            </NavLink>
          </nav>

          {/* User Account Controls */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-800 text-white font-bold text-[11px]">
                  {user.name?.[0] || 'U'}
                </span>
                <span className="font-semibold text-navy-900 hidden sm:inline max-w-[100px] truncate">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-slate-400 hover:text-red-600 transition-colors ml-1"
                  title="Sign out"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="rounded-full bg-navy-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition-all flex items-center gap-1.5"
              >
                <span>👤</span> Sign In / Register
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-navy-900">National & State Scholarship Intelligence Engine</span>
            <span className="text-slate-400">|</span>
            <span>NSP, AICTE & MahaDBT Portal Synced</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
            <span className="bg-slate-100 px-2 py-0.5 rounded border">API: Port 5000</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded border">Hybrid AI + Rule Engine</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & AI Chat Drawer */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <ChatDrawer />
    </div>
  );
}
