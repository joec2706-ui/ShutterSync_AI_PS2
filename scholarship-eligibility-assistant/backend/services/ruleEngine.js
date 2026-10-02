/**
 * Deterministic rule engine (also the fallback when Gemini is unavailable).
 *
 * Principle:
 *   known FAIL on any rule            -> NOT_ELIGIBLE
 *   all rules PASS                    -> ELIGIBLE
 *   no FAIL but some rule UNKNOWN     -> NEEDS_MORE_INFORMATION
 * Missing information is never treated as failure.
 */
const norm = (s) => String(s === undefined || s === null ? '' : s).trim().toLowerCase();
const known = (v) => v !== undefined && v !== null && String(v).trim() !== '';
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

const pass = (explanation) => ({ result: 'PASS', explanation });
const fail = (explanation) => ({ result: 'FAIL', explanation });
const unknown = (explanation, field, question) => ({ result: 'UNKNOWN', explanation, missing: { field, question } });

function checkRule(rule, p) {
  const c = rule.check || {};
  switch (c.type) {
    case 'income_max':
      if (!known(p.annualIncome)) return unknown('Your annual family income was not provided, so this income limit cannot be checked.', 'Annual family income', 'What is your annual family income (as per your income certificate)?');
      return p.annualIncome <= c.value
        ? pass(`Your annual family income is ${inr(p.annualIncome)}, which is within the ${inr(c.value)} limit.`)
        : fail(`Your annual family income is ${inr(p.annualIncome)}, which exceeds the ${inr(c.value)} limit.`);

    case 'resident_state':
      if (!known(p.stateOfResidence)) return unknown('Your state of residence was not provided.', 'State of residence', `Do you currently reside in ${c.value}?`);
      return norm(p.stateOfResidence) === norm(c.value)
        ? pass(`You reside in ${p.stateOfResidence}, as required.`)
        : fail(`You reside in ${p.stateOfResidence}, but the scheme requires residence in ${c.value}.`);

    case 'domicile_state':
      if (!known(p.domicileState)) return unknown(`Your domicile state was not provided, so ${c.value} domicile cannot be confirmed.`, 'Domicile status', `Do you have a valid ${c.value} domicile certificate?`);
      return norm(p.domicileState) === norm(c.value)
        ? pass(`Your domicile state is ${p.domicileState}, as required.`)
        : fail(`Your domicile state is ${p.domicileState}, but the scheme requires ${c.value} domicile.`);

    case 'category_in':
      if (!known(p.category)) return unknown('Your category was not provided.', 'Category', 'Which category do you belong to?');
      return c.values.some((v) => norm(v) === norm(p.category))
        ? pass(`Your category (${p.category}) is accepted by this scheme.`)
        : fail(`Your category (${p.category}) is not among the accepted categories (${c.values.join(', ')}).`);

    case 'level_in':
      if (!known(p.courseLevel)) return unknown('Your course level was not provided.', 'Course level', 'What level is your course (Diploma, UG, PG, PhD)?');
      return c.values.some((v) => norm(v) === norm(p.courseLevel))
        ? pass(`Your course level (${p.courseLevel}) is accepted by this scheme.`)
        : fail(`Your course level (${p.courseLevel}) is not among the accepted levels (${c.values.join(', ')}).`);

    case 'course_keywords': {
      if (!known(p.course)) return unknown('Your course was not provided.', 'Course', 'Which course are you enrolled in?');
      const hay = norm(p.course);
      return c.values.some((k) => hay.includes(norm(k)))
        ? pass(`Your course ("${p.course}") falls within the course field required by this scheme.`)
        : fail(`Your course ("${p.course}") does not fall within the course field required by this scheme.`);
    }

    case 'year_range':
      if (!known(p.yearOfStudy)) return unknown('Your year of study was not provided.', 'Year of study', 'Which year of study are you currently in?');
      return p.yearOfStudy >= c.min && p.yearOfStudy <= c.max
        ? pass(`You are in year ${p.yearOfStudy}, which is within the allowed range (year ${c.min} to ${c.max}).`)
        : fail(`You are in year ${p.yearOfStudy}, which is outside the allowed range (year ${c.min} to ${c.max}).`);

    case 'gender_in':
      if (!known(p.gender) || norm(p.gender) === 'prefer not to say') return unknown('Your gender was not provided, and this scheme is gender-specific.', 'Gender', 'What is your gender? (Needed only because this scheme is gender-specific.)');
      return c.values.some((v) => norm(v) === norm(p.gender))
        ? pass(`Your gender (${p.gender}) matches the scheme requirement.`)
        : fail(`Your gender (${p.gender}) does not match the scheme requirement (${c.values.join(', ')}).`);

    case 'age_max':
      if (!known(p.age)) return unknown('Your age was not provided, so the age limit cannot be checked.', 'Age', 'What is your age?');
      return p.age <= c.value
        ? pass(`Your age (${p.age}) is within the maximum of ${c.value} years.`)
        : fail(`Your age (${p.age}) exceeds the maximum of ${c.value} years.`);

    case 'age_min':
      if (!known(p.age)) return unknown('Your age was not provided, so the age requirement cannot be checked.', 'Age', 'What is your age?');
      return p.age >= c.value
        ? pass(`Your age (${p.age}) meets the minimum of ${c.value} years.`)
        : fail(`Your age (${p.age}) is below the minimum of ${c.value} years.`);

    case 'disability_required':
      if (!known(p.disability)) return unknown('Your disability status was not provided.', 'Disability status', 'Do you have a certified disability?');
      return norm(p.disability) === 'yes'
        ? pass('You indicated that you have a disability, as the scheme requires.')
        : fail('You indicated that you do not have a disability, but the scheme is only for persons with disability.');

    default:
      return unknown('This rule cannot be checked automatically from the profile.', 'Additional information', `Please confirm: ${rule.rule}`);
  }
}

function deriveStatus(results) {
  if (results.some((r) => r.result === 'FAIL')) return 'NOT_ELIGIBLE';
  if (results.some((r) => r.result === 'UNKNOWN')) return 'NEEDS_MORE_INFORMATION';
  return 'ELIGIBLE';
}

function missingDocuments(scheme, profile) {
  const have = (profile && profile.documents) || {};
  return scheme.requiredDocuments.filter((d) => have[d.key] !== true).map((d) => d.label);
}

function buildNextSteps(status, scheme, missingInfo, missingDocs, failed) {
  const steps = [];
  if (status === 'NOT_ELIGIBLE') {
    steps.push(`Review the failed rule${failed.length > 1 ? 's' : ''} (${failed.map((f) => f.ruleId).join(', ')}) — this scheme does not currently match your profile.`);
    steps.push('Check other schemes that fit your profile better.');
  } else if (status === 'NEEDS_MORE_INFORMATION') {
    steps.push(`Provide the missing information (${missingInfo.map((m) => m.field).join(', ')}) and re-run the check.`);
    if (missingDocs.length) steps.push(`Arrange these documents: ${missingDocs.join(', ')}.`);
  } else {
    if (missingDocs.length) steps.push(`Collect the required documents you do not have yet: ${missingDocs.join(', ')}.`);
    steps.push('Verify the latest official guidelines and deadline, then apply through the scheme\'s official portal.');
  }
  return steps;
}

function summarise(status, results, scheme) {
  if (status === 'NOT_ELIGIBLE') {
    const f = results.find((r) => r.result === 'FAIL');
    return `Not eligible: ${f.explanation}`;
  }
  if (status === 'NEEDS_MORE_INFORMATION') {
    const u = results.filter((r) => r.result === 'UNKNOWN');
    return `A final decision is not possible yet. ${u.length} rule${u.length > 1 ? 's' : ''} could not be checked because information is missing: ${u.map((x) => x.missing.field).join(', ')}.`;
  }
  return `Eligible: your profile satisfies all ${scheme.eligibilityRules.length} eligibility rules of this scheme.`;
}

/** Evaluates one scheme for one (already validated) profile. */
function evaluateScheme(scheme, profile) {
  const checked = scheme.eligibilityRules.map((rule) => {
    const r = checkRule(rule, profile);
    return { ruleId: rule.id, rule: rule.rule, result: r.result, explanation: r.explanation, missing: r.missing };
  });
  const status = deriveStatus(checked);
  const failed = checked.filter((r) => r.result === 'FAIL');
  const unknownRules = checked.filter((r) => r.result === 'UNKNOWN');

  const missingInformation = unknownRules.map((r) => ({ field: r.missing.field, question: r.missing.question, ruleId: r.ruleId }));
  const docs = status === 'NOT_ELIGIBLE' ? [] : missingDocuments(scheme, profile);

  // Citations: the rules that decided the outcome.
  const deciding = status === 'NOT_ELIGIBLE' ? failed : status === 'NEEDS_MORE_INFORMATION' ? unknownRules : checked;
  const citations = deciding.map((r) => ({ ruleId: r.ruleId, quotedRule: r.rule, explanation: r.explanation }));

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    provider: scheme.provider,
    status,
    confidence: status === 'NEEDS_MORE_INFORMATION' ? 'MEDIUM' : 'HIGH',
    summary: summarise(status, checked, scheme),
    reasoning: checked.map(({ ruleId, rule, result, explanation }) => ({ ruleId, rule, result, explanation })),
    citations,
    missingInformation,
    missingDocuments: docs,
    nextSteps: buildNextSteps(status, scheme, missingInformation, docs, failed),
    meta: { mode: 'rule-based', label: 'Demo/Rule-based evaluation' }
  };
}

module.exports = { evaluateScheme, deriveStatus, missingDocuments };
