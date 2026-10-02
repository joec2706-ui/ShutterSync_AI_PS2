const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

let authToken = localStorage.getItem('sea_token') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('sea_token', token);
  else localStorage.removeItem('sea_token');
}

async function request(path, { method = 'GET', body, formData, timeoutMs = 120000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    res = await fetch(`${BASE}${path}`, {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: formData || (body ? JSON.stringify(body) : undefined),
      signal: controller.signal
    });
  } catch (err) {
    throw new ApiError(
      err.name === 'AbortError' ? 'The request took too long. Please try again.' : 'Cannot reach the server. Make sure the backend is running (npm run dev) on port 5000.',
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timer);
  }
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok || !json || json.success !== true) {
    throw new ApiError(json?.error?.message || `Server error (${res.status}). The backend may not be running.`, json?.error?.code || `HTTP_${res.status}`, json?.error?.details);
  }
  return json.data;
}

export const api = {
  // Health & System Telemetry
  health: () => request('/health'),
  getSystemStatus: () => request('/system/status'),

  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  me: () => request('/auth/me'),
  updateProfile: (profile) => request('/auth/profile', { method: 'POST', body: { profile } }),

  // Schemes & Live Sync / Extraction
  getSchemes: () => request('/schemes'),
  getScheme: (id) => request(`/schemes/${encodeURIComponent(id)}`),
  syncPortals: () => request('/schemes/sync', { method: 'POST' }),
  ingestScheme: (payload) => request('/schemes/ingest-url', { method: 'POST', body: payload }),
  evaluateAll: (profile) => request('/eligibility/evaluate-all', { method: 'POST', body: { profile } }),
  evaluate: (profile, schemeId) => request('/eligibility/evaluate', { method: 'POST', body: { profile, schemeId } }),

  // What-If Simulator & Opportunity Unlock Engine
  simulateWhatIf: (profile, modifications, targetSchemeId) => 
    request('/eligibility/what-if', { method: 'POST', body: { profile, modifications, targetSchemeId } }),
  getUnlockRecommendations: (profile) => 
    request('/eligibility/unlocks', { method: 'POST', body: { profile } }),
  getSchemeGap: (schemeId, profile) => 
    request(`/eligibility/gap/${encodeURIComponent(schemeId)}`, { method: 'POST', body: { profile } }),

  // Evidence Wallet & Conflicts
  uploadDocument: (documentType, file) => {
    const fd = new FormData();
    fd.append('documentType', documentType);
    fd.append('file', file);
    return request('/documents/upload', { method: 'POST', formData: fd, timeoutMs: 60000 });
  },
  detectConflicts: (profile, wallet) => 
    request('/wallet/conflicts', { method: 'POST', body: { profile, wallet } }),
  syncWallet: (wallet) => 
    request('/wallet/sync', { method: 'POST', body: { wallet } }),

  // AI Co-Pilot Chat
  chat: (payload) => 
    request('/chat', { method: 'POST', body: payload }),

  // Shortlist
  addShortlist: (userId, schemeId, status) => request('/shortlist', { method: 'POST', body: { userId, schemeId, status } }),
  removeShortlist: (userId, schemeId) => request(`/shortlist/${encodeURIComponent(`${userId}__${schemeId}`)}`, { method: 'DELETE' })
};
