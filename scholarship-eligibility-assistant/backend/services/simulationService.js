const ruleEngine = require('./ruleEngine');
const schemeService = require('./schemeService');
const { validateProfile } = require('../utils/validation');

/**
 * Runs a deterministic simulation comparing a base profile against simulated modifications.
 */
function simulateWhatIf(baseProfile, modifications = {}, targetSchemeId = null) {
  const schemes = schemeService.getAll();
  
  // Clone and apply modifications
  const simProfileRaw = {
    ...baseProfile,
    ...modifications,
    documents: {
      ...(baseProfile.documents || {}),
      ...(modifications.documents || {})
    }
  };

  const vBase = validateProfile(baseProfile);
  const vSim = validateProfile(simProfileRaw);

  const targetList = targetSchemeId
    ? schemes.filter(s => s.id === targetSchemeId)
    : schemes;

  const comparison = targetList.map(scheme => {
    const before = ruleEngine.evaluateScheme(scheme, vBase.value || baseProfile);
    const after = ruleEngine.evaluateScheme(scheme, vSim.value || simProfileRaw);

    const statusChanged = before.status !== after.status;
    const isUnlocked = (before.status === 'NOT_ELIGIBLE' || before.status === 'NEEDS_MORE_INFORMATION') && after.status === 'ELIGIBLE';
    const isResolved = before.status === 'NEEDS_MORE_INFORMATION' && (after.status === 'ELIGIBLE' || after.status === 'NOT_ELIGIBLE');

    // Rule level diffs
    const ruleDiffs = scheme.eligibilityRules.map(rule => {
      const bRule = before.reasoning.find(r => r.ruleId === rule.id);
      const aRule = after.reasoning.find(r => r.ruleId === rule.id);
      return {
        ruleId: rule.id,
        rule: rule.rule,
        category: rule.category,
        before: {
          result: bRule ? bRule.result : 'UNKNOWN',
          explanation: bRule ? bRule.explanation : ''
        },
        after: {
          result: aRule ? aRule.result : 'UNKNOWN',
          explanation: aRule ? aRule.explanation : ''
        },
        improved: bRule?.result !== 'PASS' && aRule?.result === 'PASS',
        worsened: bRule?.result === 'PASS' && aRule?.result !== 'PASS'
      };
    });

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      provider: scheme.provider,
      statusBefore: before.status,
      statusAfter: after.status,
      statusChanged,
      isUnlocked,
      isResolved,
      beforeSummary: before.summary,
      afterSummary: after.summary,
      ruleDiffs,
      missingInfoBefore: before.missingInformation,
      missingInfoAfter: after.missingInformation,
      missingDocsBefore: before.missingDocuments,
      missingDocsAfter: after.missingDocuments
    };
  });

  const newlyEligible = comparison.filter(c => c.isUnlocked);
  const newlyIneligible = comparison.filter(c => c.statusBefore === 'ELIGIBLE' && c.statusAfter !== 'ELIGIBLE');
  const resolvedNeedsInfo = comparison.filter(c => c.statusBefore === 'NEEDS_MORE_INFORMATION' && c.statusAfter !== 'NEEDS_MORE_INFORMATION');

  const beforeCounts = { ELIGIBLE: 0, NOT_ELIGIBLE: 0, NEEDS_MORE_INFORMATION: 0 };
  const afterCounts = { ELIGIBLE: 0, NOT_ELIGIBLE: 0, NEEDS_MORE_INFORMATION: 0 };

  comparison.forEach(c => {
    beforeCounts[c.statusBefore] = (beforeCounts[c.statusBefore] || 0) + 1;
    afterCounts[c.statusAfter] = (afterCounts[c.statusAfter] || 0) + 1;
  });

  return {
    modifications,
    simulatedProfile: vSim.value || simProfileRaw,
    targetSchemeId,
    summary: {
      newlyEligibleCount: newlyEligible.length,
      newlyIneligibleCount: newlyIneligible.length,
      resolvedNeedsInfoCount: resolvedNeedsInfo.length,
      beforeCounts,
      afterCounts,
      netGain: afterCounts.ELIGIBLE - beforeCounts.ELIGIBLE
    },
    newlyEligibleSchemes: newlyEligible.map(s => ({ id: s.schemeId, name: s.schemeName })),
    comparison
  };
}

/**
 * Opportunity Unlock Engine:
 * Analyzes the user profile against all schemes and calculates the single highest-impact actions.
 */
function getOpportunityUnlocks(profile) {
  const schemes = schemeService.getAll();
  const v = validateProfile(profile);
  const currentProfile = v.value || profile;

  // Base evaluations
  const currentEvaluations = schemes.map(s => ruleEngine.evaluateScheme(s, currentProfile));
  const currentEligibleCount = currentEvaluations.filter(e => e.status === 'ELIGIBLE').length;

  const candidateActions = [];

  // 1. Domicile confirmation check
  if (!currentProfile.domicileState && currentProfile.stateOfResidence) {
    const sim = simulateWhatIf(currentProfile, {
      domicileState: currentProfile.stateOfResidence,
      documents: { domicileCertificate: true }
    });
    if (sim.summary.newlyEligibleCount > 0 || sim.summary.resolvedNeedsInfoCount > 0) {
      candidateActions.push({
        id: 'action_domicile',
        type: 'DOCUMENT_OR_INFO',
        title: `Confirm ${currentProfile.stateOfResidence} Domicile Certificate`,
        field: 'domicileState',
        suggestedValue: currentProfile.stateOfResidence,
        description: `Holding a valid ${currentProfile.stateOfResidence} domicile unlocks state-restricted quotas and resident benefits.`,
        impactScore: sim.summary.newlyEligibleCount * 10 + sim.summary.resolvedNeedsInfoCount * 4,
        unlockedCount: sim.summary.newlyEligibleCount,
        resolvedCount: sim.summary.resolvedNeedsInfoCount,
        affectedSchemes: sim.newlyEligibleSchemes,
        changes: {
          domicileState: currentProfile.stateOfResidence,
          documents: { domicileCertificate: true }
        }
      });
    }
  }

  // 2. Gender specification check
  if (!currentProfile.gender || currentProfile.gender === 'Prefer not to say') {
    ['Female', 'Male'].forEach(gender => {
      const sim = simulateWhatIf(currentProfile, { gender });
      if (sim.summary.newlyEligibleCount > 0 || sim.summary.resolvedNeedsInfoCount > 0) {
        candidateActions.push({
          id: `action_gender_${gender.toLowerCase()}`,
          type: 'PROFILE_INFO',
          title: `Specify Gender as "${gender}"`,
          field: 'gender',
          suggestedValue: gender,
          description: gender === 'Female' ? 'Unlocks special Women in STEM and female education incentives.' : 'Clarifies gender-specific criteria.',
          impactScore: sim.summary.newlyEligibleCount * 10 + sim.summary.resolvedNeedsInfoCount * 3,
          unlockedCount: sim.summary.newlyEligibleCount,
          resolvedCount: sim.summary.resolvedNeedsInfoCount,
          affectedSchemes: sim.newlyEligibleSchemes,
          changes: { gender }
        });
      }
    });
  }

  // 3. Category Certificate upload check
  if (['OBC', 'SC', 'ST', 'EWS'].includes(currentProfile.category) && !currentProfile.documents?.casteCertificate) {
    const affected = currentEvaluations.filter(e => 
      e.status !== 'NOT_ELIGIBLE' && 
      e.missingDocuments?.some(d => d.toLowerCase().includes('caste') || d.toLowerCase().includes('category'))
    );
    if (affected.length > 0) {
      candidateActions.push({
        id: 'action_caste_cert',
        type: 'DOCUMENT_UPLOAD',
        title: `Upload ${currentProfile.category} Caste Certificate`,
        field: 'documents.casteCertificate',
        suggestedValue: true,
        description: `Completes application requirements for ${affected.length} reserved category scheme${affected.length > 1 ? 's' : ''}.`,
        impactScore: affected.length * 6,
        unlockedCount: 0,
        resolvedCount: affected.length,
        affectedSchemes: affected.map(a => ({ id: a.schemeId, name: a.schemeName })),
        changes: { documents: { casteCertificate: true } }
      });
    }
  }

  // 4. Income Bracket Simulations
  const incomeTiers = [
    { limit: 250000, label: 'Income ≤ ₹2.5 Lakhs (Standard EBC Threshold)' },
    { limit: 150000, label: 'Income ≤ ₹1.5 Lakhs (Low-Income Assistance)' },
    { limit: 100000, label: 'Income ≤ ₹1.0 Lakh (Need-Based Higher Education)' },
    { limit: 500000, label: 'Income ≤ ₹5.0 Lakhs (Technical & STEM Cap)' }
  ];

  incomeTiers.forEach(tier => {
    if (currentProfile.annualIncome == null || currentProfile.annualIncome > tier.limit) {
      const sim = simulateWhatIf(currentProfile, {
        annualIncome: tier.limit,
        documents: { incomeCertificate: true }
      });
      if (sim.summary.newlyEligibleCount > 0) {
        candidateActions.push({
          id: `action_income_${tier.limit}`,
          type: 'WHAT_IF_SCENARIO',
          title: `Explore: ${tier.label}`,
          field: 'annualIncome',
          suggestedValue: tier.limit,
          description: `If verified family income meets this tier, ${sim.summary.newlyEligibleCount} additional scholarship${sim.summary.newlyEligibleCount > 1 ? 's' : ''} become fully accessible.`,
          impactScore: sim.summary.newlyEligibleCount * 8,
          unlockedCount: sim.summary.newlyEligibleCount,
          resolvedCount: sim.summary.resolvedNeedsInfoCount,
          affectedSchemes: sim.newlyEligibleSchemes,
          changes: { annualIncome: tier.limit, documents: { incomeCertificate: true } }
        });
      }
    }
  });

  // Sort actions by impactScore descending
  candidateActions.sort((a, b) => b.impactScore - a.impactScore);

  return {
    currentEligibleCount,
    totalSchemes: schemes.length,
    topAction: candidateActions[0] || null,
    recommendations: candidateActions.slice(0, 5)
  };
}

/**
 * Deep-dive gap explanation for a specific scheme
 */
function explainSchemeGap(schemeId, profile) {
  const scheme = schemeService.getById(schemeId);
  if (!scheme) throw new Error(`Scheme with ID ${schemeId} not found.`);

  const v = validateProfile(profile);
  const currentProfile = v.value || profile;
  const currentEval = ruleEngine.evaluateScheme(scheme, currentProfile);

  const failedRules = currentEval.reasoning.filter(r => r.result === 'FAIL');
  const unknownRules = currentEval.reasoning.filter(r => r.result === 'UNKNOWN');

  // Generate suggested tweaks to pass each failed rule
  const gaps = scheme.eligibilityRules.map(rule => {
    const rResult = currentEval.reasoning.find(r => r.ruleId === rule.id);
    const c = rule.check || {};
    let resolutionSuggestion = null;
    let patchPayload = {};

    if (rResult.result === 'FAIL') {
      if (c.type === 'income_max') {
        resolutionSuggestion = `Requires family income ≤ ₹${c.value.toLocaleString('en-IN')}. (Currently ₹${Number(currentProfile.annualIncome || 0).toLocaleString('en-IN')})`;
        patchPayload = { annualIncome: c.value };
      } else if (c.type === 'domicile_state') {
        resolutionSuggestion = `Requires ${c.value} domicile certificate.`;
        patchPayload = { domicileState: c.value, documents: { domicileCertificate: true } };
      } else if (c.type === 'resident_state') {
        resolutionSuggestion = `Requires residence in ${c.value}.`;
        patchPayload = { stateOfResidence: c.value };
      } else if (c.type === 'category_in') {
        resolutionSuggestion = `Requires category in [${c.values.join(', ')}].`;
        patchPayload = { category: c.values[0] };
      } else if (c.type === 'gender_in') {
        resolutionSuggestion = `Requires gender to be ${c.values.join('/')}.`;
        patchPayload = { gender: c.values[0] };
      } else if (c.type === 'disability_required') {
        resolutionSuggestion = 'Requires certified person with disability (PwD) status.';
        patchPayload = { disability: 'Yes', documents: { disabilityCertificate: true } };
      } else {
        resolutionSuggestion = `Must satisfy: ${rule.rule}`;
      }
    } else if (rResult.result === 'UNKNOWN') {
      resolutionSuggestion = `Missing data: please provide ${rule.category || 'required details'}.`;
    }

    return {
      ruleId: rule.id,
      ruleText: rule.rule,
      category: rule.category,
      currentResult: rResult.result,
      explanation: rResult.explanation,
      isResolved: rResult.result === 'PASS',
      resolutionSuggestion,
      patchPayload
    };
  });

  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    provider: scheme.provider,
    currentStatus: currentEval.status,
    isEligible: currentEval.status === 'ELIGIBLE',
    failedRulesCount: failedRules.length,
    unknownRulesCount: unknownRules.length,
    gaps,
    canBeUnlockedWithWhatIf: failedRules.length > 0 || unknownRules.length > 0
  };
}

module.exports = {
  simulateWhatIf,
  getOpportunityUnlocks,
  explainSchemeGap
};
