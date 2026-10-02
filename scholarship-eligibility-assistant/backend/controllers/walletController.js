const walletService = require('../services/walletService');
const { authService, verifyToken } = require('../services/authService');
const { ok, fail } = require('../utils/response');

exports.detectConflicts = async (req, res) => {
  try {
    const { profile, wallet } = req.body || {};
    if (!profile) return fail(res, 400, 'INVALID_PROFILE', 'Profile is required.');

    const conflicts = walletService.detectConflicts(profile, wallet || []);
    return ok(res, { conflicts });
  } catch (err) {
    return fail(res, 500, 'WALLET_ERROR', err.message);
  }
};

exports.syncWallet = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const decoded = verifyToken(token);
    if (!decoded) return fail(res, 401, 'UNAUTHORIZED', 'Authentication required to sync wallet.');

    const { wallet } = req.body || {};
    const updated = authService.updateWallet(decoded.id, wallet || []);
    return ok(res, { wallet: updated });
  } catch (err) {
    return fail(res, 500, 'WALLET_SYNC_ERROR', err.message);
  }
};
