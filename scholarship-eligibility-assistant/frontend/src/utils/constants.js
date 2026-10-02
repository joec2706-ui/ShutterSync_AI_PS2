export const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
export const COURSE_LEVELS = ['Diploma', 'Undergraduate', 'Postgraduate', 'PhD', 'Other'];
export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const DISABILITY = ['Yes', 'No'];

export const DOCUMENTS = [
  { key: 'aadhaar', label: 'Aadhaar' },
  { key: 'incomeCertificate', label: 'Income Certificate' },
  { key: 'casteCertificate', label: 'Caste Certificate' },
  { key: 'domicileCertificate', label: 'Domicile Certificate' },
  { key: 'bonafideCertificate', label: 'Bonafide Certificate' },
  { key: 'marksheet', label: 'Marksheet' },
  { key: 'disabilityCertificate', label: 'Disability Certificate' },
  { key: 'bankPassbook', label: 'Bank Account/Passbook' },
  { key: 'other', label: 'Other' }
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const STATUS = {
  ELIGIBLE: { label: '✓ ELIGIBLE', short: 'Eligible', cls: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  NOT_ELIGIBLE: { label: '✕ NOT ELIGIBLE', short: 'Not eligible', cls: 'border-red-600 bg-red-50 text-red-900' },
  NEEDS_MORE_INFORMATION: { label: '? NEEDS MORE INFORMATION', short: 'Needs information', cls: 'border-amber-600 bg-amber-50 text-amber-900' }
};

export const RULE_RESULT = {
  PASS: { label: '✓ PASS', cls: 'border-emerald-600 bg-emerald-50 text-emerald-900' },
  FAIL: { label: '✕ FAIL', cls: 'border-red-600 bg-red-50 text-red-900' },
  UNKNOWN: { label: '? UNKNOWN', cls: 'border-amber-600 bg-amber-50 text-amber-900' }
};

export const DISCLAIMER =
  'Eligibility results are verified against official guidelines from the National Scholarship Portal (NSP), AICTE, MahaDBT, and state authorities. Deterministic rule checks ensure zero AI hallucination on income and reservation cutoffs.';

