const assert = require('assert');
const schemeService = require('../services/schemeService');
const { evaluateScheme } = require('../services/ruleEngine');
const { validateProfile } = require('../utils/validation');

const docs = (...keys) => Object.fromEntries(keys.map((k) => [k, true]));
const mk = (over) => validateProfile({
  age: 20, stateOfResidence: 'Maharashtra', domicileState: 'Maharashtra', category: 'OBC',
  course: 'B.E. Computer Engineering', courseLevel: 'Undergraduate', yearOfStudy: 1, annualIncome: 200000, disability: 'No', ...over
});
const run = (profile) => Object.fromEntries(schemeService.getAll().map((s) => [s.id, evaluateScheme(s, profile)]));

// Scenario A: mixture of outcomes against verified schemes
let a = mk({ gender: '' });
assert.ok(a.valid, JSON.stringify(a.errors));
let r = run(a.value);

assert.equal(r['nsp-pm-usp-central-sector'].status, 'ELIGIBLE');
assert.equal(r['nsp-post-matric-sc'].status, 'NOT_ELIGIBLE');
assert.equal(r['aicte-pragati-girls'].status, 'NEEDS_MORE_INFORMATION');
assert.equal(r['aicte-pragati-girls'].missingInformation[0].field, 'Gender');

// Scenario B: high income (₹16 Lakhs)
let b = mk({ annualIncome: 1600000, category: 'General', gender: 'Female' });
r = run(b.value);
assert.equal(r['nsp-pm-usp-central-sector'].status, 'NOT_ELIGIBLE');
assert.equal(r['reliance-foundation-ug-scholarship'].status, 'NOT_ELIGIBLE');

// Scenario C: missing domicile + income => NEEDS_MORE_INFORMATION
let c = mk({ annualIncome: '', domicileState: '', gender: 'Male' });
r = run(c.value);
assert.equal(r['mahadbt-rajarshi-shahu-maharaj-ebc'].status, 'NEEDS_MORE_INFORMATION');
assert.equal(r['nsp-pm-usp-central-sector'].status, 'NEEDS_MORE_INFORMATION');
assert.ok(r['mahadbt-rajarshi-shahu-maharaj-ebc'].missingDocuments.includes('Maharashtra Domicile Certificate'));
// Known category failure still wins over unknowns
assert.equal(r['nsp-post-matric-sc'].status, 'NOT_ELIGIBLE');

// Documents: eligible scheme lists only the docs the user lacks
a = mk({ documents: docs('aadhaar', 'marksheet') });
r = run(a.value);
assert.deepEqual(r['nsp-pm-usp-central-sector'].missingDocuments.sort(), [
  'Bank Account/Passbook (Aadhaar Linked)',
  'Bonafide Student Certificate',
  'Income Certificate (Competent Authority)'
]);

// Validation
for (const bad of [{ annualIncome: -5 }, { annualIncome: 'abc' }, { age: 3 }, { yearOfStudy: 12 }, { category: 'Martian' }, { course: '' }]) {
  assert.equal(mk(bad).valid, false, `should reject ${JSON.stringify(bad)}`);
}
assert.equal(mk({ annualIncome: '2,00,000' }).value.annualIncome, 200000);
assert.equal(validateProfile(null).valid, false);

console.log('All engine & validation tests passed.');
