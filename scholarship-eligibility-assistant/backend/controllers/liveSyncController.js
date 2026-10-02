const schemeSyncService = require('../services/schemeSyncService');
const schemeIngestService = require('../services/schemeIngestService');
const schemeService = require('../services/schemeService');
const gemini = require('../services/geminiService');
const { ok, fail } = require('../utils/response');

/**
 * Trigger live sync from official scholarship portals (NSP, AICTE, MahaDBT, etc.)
 */
exports.syncPortals = async (req, res) => {
  try {
    const result = await schemeSyncService.performPortalSync();
    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'SYNC_ERROR', `Failed to sync external scholarship portals: ${err.message}`);
  }
};

/**
 * Ingest scholarship from arbitrary URL or notification text
 */
exports.ingestScheme = async (req, res) => {
  const { url, textContent, titleHint } = req.body || {};
  if (!url && !textContent) {
    return fail(res, 400, 'INVALID_INPUT', 'Please provide a scholarship website URL or circular text content.');
  }

  try {
    const result = await schemeIngestService.ingestScheme({ url, textContent, titleHint });
    return ok(res, result);
  } catch (err) {
    return fail(res, 422, 'INGESTION_ERROR', err.message || 'Failed to extract and ingest scholarship details.');
  }
};

/**
 * Comprehensive System & Backend Telemetry Status
 */
exports.systemStatus = (req, res) => {
  const datasetInfo = schemeService.getDatasetInfo();
  return ok(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    apiPort: process.env.PORT || 5000,
    geminiConfigured: gemini.isConfigured(),
    aiModel: gemini.isConfigured() ? gemini.MODEL() : 'Heuristic Engine Active',
    activeDataset: datasetInfo.datasetName,
    lastSyncedAt: datasetInfo.lastSyncedAt,
    portalSources: datasetInfo.portalSources,
    totalRegisteredSchemes: datasetInfo.totalCount,
    customIngestedCount: datasetInfo.customIngestedCount,
    capabilities: [
      'Hybrid AI + Deterministic Rule Engine',
      'Real-time Portal Synchronizer (NSP, AICTE, MahaDBT, CSR)',
      'Universal URL & Notice Ingestor (AI Web Extractor)',
      'Cross-Document Discrepancy & Fraud Detection',
      'What-If CGPA & Income Unlock Simulator',
      'Scheme Exclusion & Conflict Detection'
    ]
  });
};
