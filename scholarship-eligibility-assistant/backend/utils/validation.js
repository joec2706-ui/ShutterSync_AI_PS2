const { cleanText } = require('./sanitize');
const { CATEGORIES, COURSE_LEVELS, GENDERS, DISABILITY, DOCUMENTS } = require('./constants');

const present = (v) => v !== undefined && v !== null && String(v).trim() !== '';

function parseNumber(v) {
  const s = String(v).replace(/[,\s₹]/g, '').replace(/^rs\.?/i, '');
  if (s === '' || !/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

function pickEnum(raw, allowed, field, label, errors, required) {
  if (!present(raw)) {
    if (required) errors.push({ field, message: `${label} is required.` });
    return null;
  }
  const match = allowed.find((a) => a.toLowerCase() === String(raw).trim().toLowerCase());
  if (!match) {
    errors.push({ field, message: `${label} must be one of: ${allowed.join(', ')}.` });
    return null;
  }
  return match;
}

/** Validates + normalises a raw profile. Returns { valid, errors, value }. */
function validateProfile(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, errors: [{ field: 'profile', message: 'Profile must be a JSON object.' }], value: null };
  }
  const v = {};
  v.fullName = cleanText(raw.fullName, 100);

  v.age = null;
  if (present(raw.age)) {
    const n = parseNumber(raw.age);
    if (!Number.isInteger(n) || n < 10 || n > 70) errors.push({ field: 'age', message: 'Age must be a whole number between 10 and 70.' });
    else v.age = n;
  }

  v.stateOfResidence = cleanText(raw.stateOfResidence, 60);
  if (!v.stateOfResidence) errors.push({ field: 'stateOfResidence', message: 'State of residence is required.' });
  v.domicileState = cleanText(raw.domicileState, 60) || null;

  v.category = pickEnum(raw.category, CATEGORIES, 'category', 'Category', errors, true);
  v.gender = pickEnum(raw.gender, GENDERS, 'gender', 'Gender', errors, false);
  v.disability = pickEnum(raw.disability, DISABILITY, 'disability', 'Disability status', errors, false);

  v.course = cleanText(raw.course, 120);
  if (!v.course) errors.push({ field: 'course', message: 'Course is required.' });
  v.courseLevel = pickEnum(raw.courseLevel, COURSE_LEVELS, 'courseLevel', 'Course level', errors, true);

  v.yearOfStudy = null;
  if (!present(raw.yearOfStudy)) errors.push({ field: 'yearOfStudy', message: 'Year of study is required.' });
  else {
    const n = parseNumber(raw.yearOfStudy);
    if (!Number.isInteger(n) || n < 1 || n > 8) errors.push({ field: 'yearOfStudy', message: 'Year of study must be a whole number between 1 and 8.' });
    else v.yearOfStudy = n;
  }

  v.institution = cleanText(raw.institution, 150);

  v.annualIncome = null;
  if (present(raw.annualIncome)) {
    const n = parseNumber(raw.annualIncome);
    if (!Number.isFinite(n) || n < 0 || n > 1000000000) errors.push({ field: 'annualIncome', message: 'Annual family income must be a non-negative number.' });
    else v.annualIncome = n;
  }

  v.additionalInfo = cleanText(raw.additionalInfo, 500);

  v.documents = {};
  const docs = raw.documents && typeof raw.documents === 'object' && !Array.isArray(raw.documents) ? raw.documents : {};
  for (const key of Object.keys(DOCUMENTS)) v.documents[key] = docs[key] === true || docs[key] === 'true';

  return { valid: errors.length === 0, errors, value: v };
}

module.exports = { validateProfile, parseNumber, present };
