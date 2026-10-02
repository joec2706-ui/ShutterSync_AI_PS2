const { fail } = require('../utils/response');

function notFound(req, res) {
  return fail(res, 404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found.`);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'INVALID_JSON', 'Request body is not valid JSON.');
  if (err.type === 'entity.too.large') return fail(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB).' : `Upload error: ${err.message}`;
    return fail(res, err.code === 'LIMIT_FILE_SIZE' ? 413 : 400, 'UPLOAD_ERROR', msg);
  }
  console.error('[error]', err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Something went wrong on the server. Please try again.');
}

module.exports = { notFound, errorHandler };
