import { emptyProfile } from './profile';

export const DEMO_PROFILES = [
  {
    id: 'A',
    title: 'Scenario A: OBC engineering student',
    blurb: 'Mixed results: eligible, not eligible and needs information.',
    profile: {
      ...emptyProfile, fullName: 'Rohan Patil', age: '20', stateOfResidence: 'Maharashtra', domicileState: 'Maharashtra',
      category: 'OBC', gender: '', course: 'B.E. Computer Engineering', courseLevel: 'Undergraduate', yearOfStudy: '3',
      institution: 'Demo Institute of Technology', annualIncome: '200000', disability: 'No',
      documents: { aadhaar: true, incomeCertificate: true, casteCertificate: true, bonafideCertificate: true, marksheet: true }
    }
  },
  {
    id: 'B',
    title: 'Scenario B: High-income student',
    blurb: 'Income ₹8,00,000 triggers income-based NOT ELIGIBLE results.',
    profile: {
      ...emptyProfile, fullName: 'Ananya Rao', age: '21', stateOfResidence: 'Maharashtra', domicileState: 'Maharashtra',
      category: 'General', gender: 'Female', course: 'B.Tech Information Technology', courseLevel: 'Undergraduate', yearOfStudy: '2',
      institution: 'Demo College of Engineering', annualIncome: '800000', disability: 'Yes',
      documents: { aadhaar: true, incomeCertificate: true, bonafideCertificate: true, marksheet: true }
    }
  },
  {
    id: 'C',
    title: 'Scenario C: Incomplete profile',
    blurb: 'Domicile, income and gender missing → NEEDS MORE INFORMATION.',
    profile: {
      ...emptyProfile, age: '19', stateOfResidence: 'Maharashtra', domicileState: '', category: 'General', gender: '',
      course: 'B.A. Economics', courseLevel: 'Undergraduate', yearOfStudy: '1', annualIncome: '', disability: '',
      documents: { aadhaar: true }
    }
  }
];
