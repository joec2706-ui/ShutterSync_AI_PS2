const simulation = require('../services/simulationService');
const { ok, fail } = require('../utils/response');

exports.simulate = async (req, res) => {
  try {
    const { profile, modifications, targetSchemeId } = req.body || {};
    if (!profile) return fail(res, 400, 'INVALID_PROFILE', 'Profile is required for simulation.');

    const result = simulation.simulateWhatIf(profile, modifications || {}, targetSchemeId || null);
    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'SIMULATION_ERROR', err.message);
  }
};

exports.unlockRecommendations = async (req, res) => {
  try {
    const { profile } = req.body || {};
    if (!profile) return fail(res, 400, 'INVALID_PROFILE', 'Profile is required.');

    const result = simulation.getOpportunityUnlocks(profile);
    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'RECOMMENDATION_ERROR', err.message);
  }
};

exports.schemeGap = async (req, res) => {
  try {
    const { schemeId } = req.params;
    const { profile } = req.body || {};
    if (!schemeId) return fail(res, 400, 'INVALID_SCHEME_ID', 'Scheme ID is required.');
    if (!profile) return fail(res, 400, 'INVALID_PROFILE', 'Profile is required.');

    const result = simulation.explainSchemeGap(schemeId, profile);
    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'GAP_ANALYSIS_ERROR', err.message);
  }
};
