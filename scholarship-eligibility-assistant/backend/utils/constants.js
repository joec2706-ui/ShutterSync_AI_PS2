const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other'];
const COURSE_LEVELS = ['Diploma', 'Undergraduate', 'Postgraduate', 'PhD', 'Other'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const DISABILITY = ['Yes', 'No'];

const DOCUMENTS = {
  aadhaar: 'Aadhaar',
  incomeCertificate: 'Income Certificate',
  casteCertificate: 'Caste Certificate',
  domicileCertificate: 'Domicile Certificate',
  bonafideCertificate: 'Bonafide Certificate',
  marksheet: 'Marksheet',
  disabilityCertificate: 'Disability Certificate',
  bankPassbook: 'Bank Account/Passbook',
  other: 'Other'
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

module.exports = { CATEGORIES, COURSE_LEVELS, GENDERS, DISABILITY, DOCUMENTS, INDIAN_STATES };
