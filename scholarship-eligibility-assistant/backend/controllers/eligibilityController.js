const schemeService = require('../services/schemeService');
const evaluation = require('../services/evaluationService');
const gemini = require('../services/geminiService');
const { validateProfile } = require('../utils/validation');
const { ok, fail } = require('../utils/response');

exports.evaluate = async (req, res, next) => {
  try {
    const { profile, schemeId } = req.body || {};
    const v = validateProfile(profile);
    if (!v.valid) return fail(res, 400, 'VALIDATION_ERROR', 'Please correct the highlighted profile fields.', v.errors);
    if (typeof schemeId !== 'string' || !schemeId) return fail(res, 400, 'INVALID_SCHEME_ID', 'schemeId is required.');
    const scheme = schemeService.getById(schemeId);
    if (!scheme) return fail(res, 404, 'SCHEME_NOT_FOUND', `No scheme found with ID "${schemeId}".`);
    const result = await evaluation.evaluateOne(v.value, scheme);
    return ok(res, { evaluation: result });
  } catch (err) { return next(err); }
};

exports.evaluateAll = async (req, res, next) => {
  try {
    const v = validateProfile((req.body || {}).profile);
    if (!v.valid) return fail(res, 400, 'VALIDATION_ERROR', 'Please correct the highlighted profile fields.', v.errors);
    const schemes = schemeService.getAll();
    const results = await evaluation.evaluateAll(v.value, schemes);
    const { counts, mode, fallbackReason } = evaluation.summarise(results);
    return ok(res, {
      dataset: schemeService.getDatasetInfo().datasetName,
      mode, fallbackReason, geminiConfigured: gemini.isConfigured(),
      counts, results, evaluatedAt: new Date().toISOString()
    });
  } catch (err) { return next(err); }
};
