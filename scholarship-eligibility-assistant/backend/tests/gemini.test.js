// Tests the Gemini integration path with a stubbed fetch (no network / API key needed).
const assert = require('assert');
process.env.GEMINI_API_KEY = 'test-key';
const schemeService = require('../services/schemeService');
const evaluation = require('../services/evaluationService');
const { validateProfile } = require('../utils/validation');

const profile = validateProfile({
  age: 20, stateOfResidence: 'Maharashtra', domicileState: 'Maharashtra', category: 'General',
  course: 'B.E. Computer Engineering', courseLevel: 'Undergraduate', yearOfStudy: 3, annualIncome: 500000, disability: 'No'
}).value;

const scheme = schemeService.getById('nsp-pm-usp-central-sector'); // income limit 4.5L -> must be NOT_ELIGIBLE

const reply = (obj, raw) => async () => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text: raw || JSON.stringify(obj) }] } }] })
});

(async () => {
  // 1) Gemini LIES (says ELIGIBLE / R1 PASS) -> engine must override; citation text must be the real rule.
  global.fetch = reply({
    status: 'ELIGIBLE', confidence: 'HIGH', summary: 'You are eligible.',
    reasoning: scheme.eligibilityRules.map((r) => ({ ruleId: r.id, rule: r.rule, result: 'PASS', explanation: 'ok' })),
    citations: [{ ruleId: 'R1', quotedRule: 'MADE UP TEXT', explanation: 'Income is fine.' }, { ruleId: 'R99', quotedRule: 'x', explanation: 'x' }],
    nextSteps: ['Apply now']
  });
  let r = await evaluation.evaluateOne(profile, scheme);
  assert.equal(r.status, 'NOT_ELIGIBLE');
  assert.equal(r.meta.mode, 'gemini');
  assert.ok(r.meta.engineOverrides >= 1);
  assert.equal(r.citations[0].ruleId, 'R1');
  assert.equal(r.citations[0].quotedRule, scheme.eligibilityRules[0].rule);
  assert.ok(!r.citations.some((c) => c.ruleId === 'R99'));

  // 2) Honest Gemini answer is used as-is (explanations kept), wrapped in ```json fences.
  global.fetch = reply(null, '```json\n' + JSON.stringify({
    status: 'NOT_ELIGIBLE', confidence: 'HIGH', summary: 'Income of ₹5,00,000 exceeds the ₹4,50,000 limit.',
    reasoning: scheme.eligibilityRules.map((r, i) => ({ ruleId: r.id, rule: r.rule, result: i === 0 ? 'FAIL' : 'PASS', explanation: 'AI explanation ' + r.id })),
    citations: [{ ruleId: 'R1', quotedRule: scheme.eligibilityRules[0].rule, explanation: 'Limit exceeded.' }], nextSteps: ['Look at other schemes.']
  }) + '\n```');
  r = await evaluation.evaluateOne(profile, scheme);
  assert.equal(r.status, 'NOT_ELIGIBLE');
  assert.equal(r.summary, 'Income of ₹5,00,000 exceeds the ₹4,50,000 limit.');
  assert.equal(r.meta.engineOverrides, 0);

  // 3) Malformed JSON -> graceful fallback, not fatal.
  global.fetch = reply(null, 'Sorry, here is some prose { not json');
  r = await evaluation.evaluateOne(profile, scheme);
  assert.equal(r.meta.mode, 'rule-based');
  assert.equal(r.status, 'NOT_ELIGIBLE');

  // 4) HTTP 429 -> fatal for the batch: only the first wave of calls is attempted, rest skipped.
  let calls = 0;
  global.fetch = async () => { calls += 1; return { ok: false, status: 429, json: async () => ({ error: { message: 'quota' } }) }; };
  const all = await evaluation.evaluateAll(profile, schemeService.getAll());
  assert.equal(all.length, schemeService.getAll().length);
  assert.ok(all.every((x) => x.meta.mode === 'rule-based'));
  assert.ok(calls <= 3, `expected <=3 calls, got ${calls}`);

  // 5) Network failure -> fallback.
  global.fetch = async () => { throw new TypeError('fetch failed'); };
  r = await evaluation.evaluateOne(profile, scheme);
  assert.equal(r.meta.mode, 'rule-based');

  console.log('All Gemini integration tests passed.');
})().catch((e) => { console.error(e); process.exit(1); });
