const ruleEngine = require('./ruleEngine');
const gemini = require('./geminiService');

const CONCURRENCY = 3;

/** Gemini first (if available), deterministic rule engine otherwise. Never throws. */
async function evaluateOne(profile, scheme, state = {}) {
  const base = ruleEngine.evaluateScheme(scheme, profile);
  if (!state.disabledReason && !gemini.isConfigured()) state.disabledReason = 'GEMINI_API_KEY is not configured';
  if (state.disabledReason) {
    base.meta.fallbackReason = state.disabledReason;
    return base;
  }
  try {
    return await gemini.evaluate(scheme, profile, base);
  } catch (err) {
    console.warn(`[gemini] ${scheme.id}: ${err.message} -> using rule-based fallback`);
    if (err.fatal) state.disabledReason = err.message;
    base.meta.fallbackReason = err.message;
    return base;
  }
}

async function evaluateAll(profile, schemes) {
  const state = {};
  const results = new Array(schemes.length);
  let next = 0;
  const worker = async () => {
    while (next < schemes.length) {
      const i = next++;
      results[i] = await evaluateOne(profile, schemes[i], state);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, schemes.length) }, worker));
  return results;
}

function summarise(results) {
  const counts = { ELIGIBLE: 0, NOT_ELIGIBLE: 0, NEEDS_MORE_INFORMATION: 0 };
  results.forEach((r) => { counts[r.status] += 1; });
  const ai = results.filter((r) => r.meta.mode === 'gemini').length;
  const mode = ai === results.length ? 'gemini' : ai === 0 ? 'rule-based' : 'mixed';
  const reason = results.find((r) => r.meta.fallbackReason)?.meta.fallbackReason || null;
  return { counts, mode, fallbackReason: reason };
}

module.exports = { evaluateOne, evaluateAll, summarise };
