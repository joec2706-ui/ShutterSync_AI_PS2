const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'schemes.json');

// In-memory working database initialized from JSON file
let dataset = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
let customIngestedSchemes = [];

const reloadFromDisk = () => {
  try {
    dataset = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (err) {
    console.error('Error reloading schemes.json:', err);
  }
};

const getDatasetInfo = () => ({
  datasetName: dataset.datasetName,
  disclaimer: dataset.disclaimer,
  lastSyncedAt: dataset.lastSyncedAt || new Date().toISOString(),
  portalSources: dataset.portalSources || [],
  totalCount: getAll().length,
  customIngestedCount: customIngestedSchemes.length
});

const getAll = () => {
  return [...dataset.schemes, ...customIngestedSchemes];
};

const getById = (id) => {
  return getAll().find((s) => s.id === id) || null;
};

// Add dynamically ingested scheme (from live URL scrape or user paste)
const addScheme = (scheme) => {
  // Prevent duplicate IDs
  const existingIdx = customIngestedSchemes.findIndex((s) => s.id === scheme.id);
  if (existingIdx >= 0) {
    customIngestedSchemes[existingIdx] = scheme;
  } else {
    // Check if it exists in main dataset
    const mainIdx = dataset.schemes.findIndex((s) => s.id === scheme.id);
    if (mainIdx >= 0) {
      dataset.schemes[mainIdx] = scheme;
    } else {
      customIngestedSchemes.unshift(scheme);
    }
  }
  return scheme;
};

// Update sync timestamp and optionally merge newly scraped schemes
const updateSyncStatus = (newSchemes = []) => {
  dataset.lastSyncedAt = new Date().toISOString();
  if (Array.isArray(newSchemes) && newSchemes.length > 0) {
    newSchemes.forEach(addScheme);
  }
  return getDatasetInfo();
};

// Public view includes full rich presentation metadata
function toPublic(scheme) {
  return {
    ...scheme,
    eligibilityRules: scheme.eligibilityRules.map(({ id, category, rule }) => ({ id, category, rule }))
  };
}

module.exports = {
  getAll,
  getById,
  toPublic,
  getDatasetInfo,
  addScheme,
  updateSyncStatus,
  reloadFromDisk
};
