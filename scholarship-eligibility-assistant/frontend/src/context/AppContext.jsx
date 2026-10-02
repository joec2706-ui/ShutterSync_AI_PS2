import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { emptyProfile } from '../utils/profile';
import { api, setAuthToken } from '../services/api';

const AppContext = createContext(null);

function load(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function save(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sea_token') || null);
  const [user, setUser] = useState(() => load(localStorage, 'sea_user', null));
  const [profile, setProfile] = useState(() => ({
    ...emptyProfile,
    ...load(localStorage, 'sea_profile', {})
  }));
  const [wallet, setWallet] = useState(() => load(localStorage, 'sea_wallet', []));
  const [conflicts, setConflicts] = useState([]);
  const [results, setResults] = useState(() => load(sessionStorage, 'sea_results', null));
  const [unlocks, setUnlocks] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shortlist, setShortlist] = useState(() => {
    const s = load(localStorage, 'sea_shortlist', []);
    return Array.isArray(s) ? s : [];
  });

  // Sync token to API client
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  // Sync state to local storage
  useEffect(() => save(localStorage, 'sea_profile', profile), [profile]);
  useEffect(() => save(sessionStorage, 'sea_results', results), [results]);
  useEffect(() => save(localStorage, 'sea_shortlist', shortlist), [shortlist]);
  useEffect(() => save(localStorage, 'sea_wallet', wallet), [wallet]);
  useEffect(() => save(localStorage, 'sea_user', user), [user]);

  // Check conflicts whenever profile or wallet changes
  const checkConflicts = useCallback(async () => {
    try {
      if (!wallet || wallet.length === 0) {
        setConflicts([]);
        return;
      }
      const data = await api.detectConflicts(profile, wallet);
      setConflicts(data.conflicts || []);
    } catch {
      // silent fallback
    }
  }, [profile, wallet]);

  useEffect(() => {
    checkConflicts();
  }, [checkConflicts]);

  // Fetch opportunity unlocks whenever profile changes
  const fetchUnlocks = useCallback(async () => {
    try {
      const data = await api.getUnlockRecommendations(profile);
      setUnlocks(data);
    } catch {
      // silent fallback
    }
  }, [profile]);

  useEffect(() => {
    fetchUnlocks();
  }, [fetchUnlocks]);

  // Authentication methods
  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    setToken(data.token);
    if (data.user.profile && Object.keys(data.user.profile).length > 0) {
      setProfile((prev) => ({ ...prev, ...data.user.profile }));
    }
    if (data.user.wallet) {
      setWallet(data.user.wallet);
    }
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password, name }) => {
    const data = await api.register({ email, password, name, profile });
    setUser(data.user);
    setToken(data.token);
    return data.user;
  }, [profile]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sea_token');
    localStorage.removeItem('sea_user');
  }, []);

  // Quick switch demo user for testing & hackathon presentations
  const switchDemoUser = useCallback(async (demoEmail) => {
    try {
      const res = await api.login({ email: demoEmail, password: 'password123' });
      setUser(res.user);
      setToken(res.token);
      if (res.user.profile) setProfile({ ...emptyProfile, ...res.user.profile });
      if (res.user.wallet) setWallet(res.user.wallet);
      return res.user;
    } catch (err) {
      console.warn('Demo switch failed:', err);
    }
  }, []);

  // Wallet methods
  const addWalletDocument = useCallback((doc) => {
    setWallet((prev) => {
      const updated = [...prev.filter((d) => d.documentType !== doc.documentType), doc];
      if (token) api.syncWallet(updated).catch(() => {});
      return updated;
    });
    // Mark document as present in profile
    setProfile((prev) => ({
      ...prev,
      documents: {
        ...(prev.documents || {}),
        [doc.documentType]: true
      }
    }));
  }, [token]);

  const removeWalletDocument = useCallback((docIdOrType) => {
    setWallet((prev) => {
      const updated = prev.filter((d) => d.id !== docIdOrType && d.documentType !== docIdOrType);
      if (token) api.syncWallet(updated).catch(() => {});
      return updated;
    });
    setProfile((prev) => ({
      ...prev,
      documents: {
        ...(prev.documents || {}),
        [docIdOrType]: false
      }
    }));
  }, [token]);

  // Conflict resolution
  const resolveConflict = useCallback((conflict, action) => {
    if (action === 'APPLY_DOCUMENT_VALUE') {
      const resolution = conflict.resolutions?.find((r) => r.action === 'APPLY_DOCUMENT_VALUE');
      if (resolution?.patch) {
        setProfile((prev) => ({
          ...prev,
          ...resolution.patch
        }));
      }
    }
    setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
  }, []);

  // Shortlist methods
  const userId = user?.id || 'demo-user';
  const isShortlisted = useCallback((id) => shortlist.some((s) => s.schemeId === id), [shortlist]);

  const toggleShortlist = useCallback((evaluation) => {
    const id = evaluation.schemeId;
    setShortlist((prev) => {
      if (prev.some((s) => s.schemeId === id)) {
        api.removeShortlist(userId, id).catch(() => {});
        return prev.filter((s) => s.schemeId !== id);
      }
      api.addShortlist(userId, id, evaluation.status).catch(() => {});
      return [
        ...prev,
        {
          schemeId: id,
          name: evaluation.schemeName,
          provider: evaluation.provider,
          status: evaluation.status,
          savedAt: new Date().toISOString()
        }
      ];
    });
  }, [userId]);

  const removeFromShortlist = useCallback((id) => {
    setShortlist((prev) => prev.filter((s) => s.schemeId !== id));
    api.removeShortlist(userId, id).catch(() => {});
  }, [userId]);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      register,
      logout,
      switchDemoUser,
      profile,
      setProfile,
      wallet,
      setWallet,
      addWalletDocument,
      removeWalletDocument,
      conflicts,
      checkConflicts,
      resolveConflict,
      unlocks,
      fetchUnlocks,
      results,
      setResults,
      shortlist,
      isShortlisted,
      toggleShortlist,
      removeFromShortlist,
      isChatOpen,
      setIsChatOpen
    }),
    [
      user,
      token,
      login,
      register,
      logout,
      switchDemoUser,
      profile,
      wallet,
      addWalletDocument,
      removeWalletDocument,
      conflicts,
      checkConflicts,
      resolveConflict,
      unlocks,
      fetchUnlocks,
      results,
      shortlist,
      isShortlisted,
      toggleShortlist,
      removeFromShortlist,
      isChatOpen
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
