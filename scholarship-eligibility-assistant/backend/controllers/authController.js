const { authService, verifyToken } = require('../services/authService');
const { ok, fail } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { email, password, name, profile } = req.body || {};
    const result = authService.register({ email, password, name, profile });
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, 400, 'AUTH_ERROR', err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = authService.login({ email, password });
    return ok(res, result);
  } catch (err) {
    return fail(res, 401, 'AUTH_FAILED', err.message);
  }
};

exports.me = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return fail(res, 401, 'UNAUTHORIZED', 'Missing authorization token.');

    const decoded = verifyToken(token);
    if (!decoded) return fail(res, 401, 'INVALID_TOKEN', 'Session expired or invalid token.');

    const user = authService.getUserById(decoded.id);
    if (!user) return fail(res, 404, 'USER_NOT_FOUND', 'User does not exist.');

    return ok(res, { user });
  } catch (err) {
    return fail(res, 500, 'SERVER_ERROR', err.message);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const decoded = verifyToken(token);
    if (!decoded) return fail(res, 401, 'UNAUTHORIZED', 'Login required to update profile.');

    const { profile } = req.body || {};
    const updated = authService.updateProfile(decoded.id, profile);
    return ok(res, { profile: updated });
  } catch (err) {
    return fail(res, 400, 'UPDATE_ERROR', err.message);
  }
};
