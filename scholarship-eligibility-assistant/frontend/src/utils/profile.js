import { CATEGORIES, COURSE_LEVELS, GENDERS, DISABILITY } from './constants';

export const emptyProfile = {
  fullName: '', age: '', stateOfResidence: '', domicileState: '', category: '', gender: '',
  course: '', courseLevel: '', yearOfStudy: '', institution: '', annualIncome: '', disability: '',
  additionalInfo: '', documents: {}
};

const blank = (v) => v === undefined || v === null || String(v).trim() === '';
const num = (v) => Number(String(v).replace(/[,\s₹]/g, ''));

/** Frontend validation (the backend validates again — never trust the client alone). */
export function validateForm(f) {
  const e = {};
  if (!blank(f.age)) {
    const n = num(f.age);
    if (!Number.isInteger(n) || n < 10 || n > 70) e.age = 'Enter a whole number between 10 and 70.';
  }
  if (blank(f.stateOfResidence)) e.stateOfResidence = 'Please select your state of residence.';
  if (blank(f.category) || !CATEGORIES.includes(f.category)) e.category = 'Please select your category.';
  if (!blank(f.gender) && !GENDERS.includes(f.gender)) e.gender = 'Invalid selection.';
  if (blank(f.course)) e.course = 'Please enter your course.';
  if (blank(f.courseLevel) || !COURSE_LEVELS.includes(f.courseLevel)) e.courseLevel = 'Please select your course level.';
  if (blank(f.yearOfStudy)) e.yearOfStudy = 'Please enter your year of study.';
  else {
    const n = num(f.yearOfStudy);
    if (!Number.isInteger(n) || n < 1 || n > 8) e.yearOfStudy = 'Enter a whole number between 1 and 8.';
  }
  if (!blank(f.annualIncome)) {
    const n = num(f.annualIncome);
    if (!Number.isFinite(n) || n < 0) e.annualIncome = 'Enter a valid non-negative amount, e.g. 200000.';
  }
  if (!blank(f.disability) && !DISABILITY.includes(f.disability)) e.disability = 'Invalid selection.';
  return e;
}

/** Converts form strings to the API payload (blank => null/omitted). */
export function toPayload(f) {
  return {
    fullName: f.fullName.trim(),
    age: blank(f.age) ? null : num(f.age),
    stateOfResidence: f.stateOfResidence,
    domicileState: blank(f.domicileState) ? null : f.domicileState,
    category: f.category,
    gender: blank(f.gender) ? null : f.gender,
    course: f.course.trim(),
    courseLevel: f.courseLevel,
    yearOfStudy: blank(f.yearOfStudy) ? null : num(f.yearOfStudy),
    institution: f.institution.trim(),
    annualIncome: blank(f.annualIncome) ? null : num(f.annualIncome),
    disability: blank(f.disability) ? null : f.disability,
    additionalInfo: f.additionalInfo.trim(),
    documents: f.documents || {}
  };
}

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
