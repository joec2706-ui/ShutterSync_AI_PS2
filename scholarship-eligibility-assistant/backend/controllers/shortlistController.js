const fs = require('fs');
const path = require('path');
const schemeService = require('../services/schemeService');
const { ok, fail } = require('../utils/response');

// Simple in-memory store, persisted best-effort to a JSON file. Replace with a DB later.
const FILE = path.join(__dirname, '..', 'data', 'shortlist.json');
let store = {};
try { store = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { store = {}; }
const persist = () => { try { fs.writeFileSync(FILE, JSON.stringify(store, null, 2)); } catch { /* read-only FS is fine */ } };

const USER_RE = /^[A-Za-z0-9-]{1,64}$/;
const makeId = (userId, schemeId) => `${userId}__${schemeId}`;
const STATUSES = ['ELIGIBLE', 'NOT_ELIGIBLE', 'NEEDS_MORE_INFORMATION'];

exports.list = (req, res) => {
  const { userId } = req.params;
  if (!USER_RE.test(userId)) return fail(res, 400, 'INVALID_USER_ID', 'userId may contain letters, numbers and hyphens only.');
  const items = Object.values(store).filter((i) => i.userId === userId).map((i) => ({ ...i, scheme: schemeService.toPublic(schemeService.getById(i.schemeId)) }));
  return ok(res, { items });
};

exports.add = (req, res) => {
  const { schemeId, status } = req.body || {};
  const userId = (req.body && req.body.userId) || 'demo-user';
  if (!USER_RE.test(String(userId))) return fail(res, 400, 'INVALID_USER_ID', 'userId may contain letters, numbers and hyphens only.');
  if (typeof schemeId !== 'string' || !schemeService.getById(schemeId)) return fail(res, 404, 'SCHEME_NOT_FOUND', 'Scheme not found.');
  const id = makeId(userId, schemeId);
  const existed = Boolean(store[id]);
  store[id] = { id, userId, schemeId, status: STATUSES.includes(status) ? status : null, savedAt: (store[id] && store[id].savedAt) || new Date().toISOString() };
  persist();
  return ok(res, { item: store[id] }, existed ? 200 : 201);
};

exports.remove = (req, res) => {
  const id = String(req.params.id || '');
  if (!store[id]) return fail(res, 404, 'SHORTLIST_ITEM_NOT_FOUND', 'Shortlist item not found.');
  delete store[id];
  persist();
  return ok(res, { id, deleted: true });
};
