const schemeService = require('../services/schemeService');
const { ok, fail } = require('../utils/response');

exports.list = (req, res) => ok(res, { dataset: schemeService.getDatasetInfo(), schemes: schemeService.getAll().map(schemeService.toPublic) });

exports.getOne = (req, res) => {
  const id = String(req.params.id || '');
  if (!/^[a-z0-9-]{1,80}$/i.test(id)) return fail(res, 400, 'INVALID_SCHEME_ID', 'Scheme ID is not valid.');
  const scheme = schemeService.getById(id);
  if (!scheme) return fail(res, 404, 'SCHEME_NOT_FOUND', `No scheme found with ID "${id}".`);
  return ok(res, { scheme: schemeService.toPublic(scheme) });
};
