const { DOCUMENTS } = require('../utils/constants');

function detectConflicts(profile, wallet = []) {
  const conflicts = [];
  if (!wallet || !Array.isArray(wallet) || wallet.length === 0) return conflicts;

  wallet.forEach((doc) => {
    const ext = doc.extracted || {};

    // 1. Income conflict
    if (ext.extractedIncome != null && profile.annualIncome != null) {
      const docIncome = Number(ext.extractedIncome);
      const profIncome = Number(profile.annualIncome);
      if (Math.abs(docIncome - profIncome) > 100) { // Tolerance of 100 INR for rounding
        conflicts.push({
          id: `conflict_income_${doc.id || doc.documentType}`,
          field: 'annualIncome',
          fieldName: 'Annual Family Income',
          documentType: doc.label || DOCUMENTS[doc.documentType] || doc.documentType,
          profileValue: profIncome,
          documentValue: docIncome,
          profileDisplay: `₹${profIncome.toLocaleString('en-IN')}`,
          documentDisplay: `₹${docIncome.toLocaleString('en-IN')}`,
          severity: 'HIGH',
          message: `Profile states ₹${profIncome.toLocaleString('en-IN')} annual income, but the uploaded ${doc.label || 'Income Certificate'} verifies ₹${docIncome.toLocaleString('en-IN')}.`,
          impact: 'Government authorities check certificates strictly against entered figures.',
          resolutions: [
            {
              action: 'APPLY_DOCUMENT_VALUE',
              label: `Update Profile to ₹${docIncome.toLocaleString('en-IN')}`,
              patch: { annualIncome: docIncome }
            },
            {
              action: 'KEEP_PROFILE_VALUE',
              label: 'Keep Profile Value (Requires re-verification)',
              patch: {}
            }
          ]
        });
      }
    }

    // 2. State / Domicile conflict
    if (ext.state && (doc.documentType === 'domicileCertificate' || doc.documentType === 'Domicile Certificate')) {
      const profState = profile.domicileState || profile.stateOfResidence;
      if (profState && profState.toLowerCase() !== ext.state.toLowerCase()) {
        conflicts.push({
          id: `conflict_domicile_${doc.id || doc.documentType}`,
          field: 'domicileState',
          fieldName: 'Domicile State',
          documentType: doc.label || 'Domicile Certificate',
          profileValue: profState,
          documentValue: ext.state,
          profileDisplay: profState,
          documentDisplay: ext.state,
          severity: 'HIGH',
          message: `Profile domicile is set to "${profState}", but the certificate was issued for "${ext.state}".`,
          impact: 'State-specific scholarships may reject mismatched domicile claims.',
          resolutions: [
            {
              action: 'APPLY_DOCUMENT_VALUE',
              label: `Set Domicile to "${ext.state}"`,
              patch: { domicileState: ext.state, stateOfResidence: ext.state }
            }
          ]
        });
      }
    }

    // 3. Name discrepancy check
    if (ext.name && profile.fullName) {
      const pName = profile.fullName.trim().toLowerCase();
      const dName = ext.name.trim().toLowerCase();
      if (pName && dName && !pName.includes(dName) && !dName.includes(pName)) {
        conflicts.push({
          id: `conflict_name_${doc.id || doc.documentType}`,
          field: 'fullName',
          fieldName: 'Applicant Name',
          documentType: doc.label || 'Certificate',
          profileValue: profile.fullName,
          documentValue: ext.name,
          profileDisplay: profile.fullName,
          documentDisplay: ext.name,
          severity: 'MEDIUM',
          message: `Name in profile ("${profile.fullName}") doesn't closely match name on document ("${ext.name}").`,
          impact: 'Name mismatch on certificates can delay disbursals.',
          resolutions: [
            {
              action: 'APPLY_DOCUMENT_VALUE',
              label: `Update Profile Name to "${ext.name}"`,
              patch: { fullName: ext.name }
            }
          ]
        });
      }
    }
  });

  return conflicts;
}

module.exports = {
  detectConflicts
};
