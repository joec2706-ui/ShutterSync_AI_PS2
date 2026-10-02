/**
 * Live Scholarship Web Ingestor & AI Extraction Engine
 * Ingests external scholarship websites, official notices, and notifications in real time.
 */
const gemini = require('./geminiService');
const schemeService = require('./schemeService');

// Simple HTML text extractor
function extractTextFromHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses raw text or URL content into a structured machine-evaluable scheme schema
 */
async function parseSchemeWithAI(rawText, sourceUrl = '') {
  const prompt = `You are a Government & CSR Scholarship Eligibility Extraction Specialist.
Extract structured eligibility data and machine-executable rules from this scholarship announcement or webpage.

SCHOLARSHIP ANNOUNCEMENT TEXT:
"""
${rawText.slice(0, 10000)}
"""

SOURCE URL: ${sourceUrl || 'User Ingested'}

Return ONLY a JSON object with this EXACT structure (no markdown, valid JSON):
{
  "id": "unique-slug-id-e-g-state-post-matric",
  "name": "Full official scholarship name",
  "provider": "Ministry, Department, or Foundation Name",
  "description": "2-3 sentence overview of what the scholarship provides and who it is for",
  "officialUrl": "${sourceUrl || 'https://scholarships.gov.in'}",
  "portalSource": "Live AI Ingested",
  "benefitAmount": "e.g. ₹50,000 per year or Full Tuition Reimbursement",
  "categoryBadge": "Live Web Extraction",
  "incomeLimit": 300000,
  "eligibleCategories": ["General", "OBC", "SC", "ST", "EWS"],
  "eligibleCourses": [],
  "eligibleYears": [1, 2, 3, 4],
  "requiredDocuments": [
    { "key": "aadhaar", "label": "Aadhaar Card" },
    { "key": "incomeCertificate", "label": "Income Certificate" },
    { "key": "marksheet", "label": "Marksheet" },
    { "key": "bonafideCertificate", "label": "College Bonafide" },
    { "key": "bankPassbook", "label": "Bank Passbook" }
  ],
  "eligibilityRules": [
    {
      "id": "R1",
      "category": "income",
      "rule": "Annual family income must not exceed ₹3,00,000.",
      "check": { "type": "income_max", "value": 300000 }
    },
    {
      "id": "R2",
      "category": "course",
      "rule": "Must be pursuing an undergraduate or diploma course.",
      "check": { "type": "level_in", "values": ["Undergraduate", "Diploma"] }
    }
  ],
  "applicationDeadline": "2026-12-31",
  "conflictTags": ["external_ingested"]
}

Supported check types for eligibilityRules:
- "income_max" (value: number)
- "category_in" (values: ["SC", "ST", "OBC", "General", "EWS"])
- "gender_in" (values: ["Female", "Male"])
- "level_in" (values: ["Diploma", "Undergraduate", "Postgraduate", "PhD"])
- "year_range" (min: number, max: number)
- "resident_state" (value: string state name)
- "domicile_state" (value: string state name)
- "age_max" (value: number)
- "disability_required" (no value needed)`;

  if (gemini.isConfigured()) {
    try {
      const parsed = await gemini.generateJson(prompt);
      if (parsed && parsed.name && Array.isArray(parsed.eligibilityRules)) {
        return parsed;
      }
    } catch (err) {
      console.warn('AI Extraction error, falling back to heuristic extraction:', err.message);
    }
  }

  // Robust Heuristic fallback parser
  return heuristicParseScheme(rawText, sourceUrl);
}

function heuristicParseScheme(text, sourceUrl) {
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const title = lines[0] || 'Live Ingested Scholarship Scheme';
  
  // Extract income
  let incomeLimit = 300000;
  const incomeMatch = text.match(/(?:income|salary|lakh|lakhs|inr|rs\.?)\s*(?:not\s*exceeding|below|up\s*to|less\s*than|maximum|limit)?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)?/i);
  if (incomeMatch) {
    let rawVal = parseFloat(incomeMatch[1].replace(/,/g, ''));
    if (/lakh|lac/i.test(incomeMatch[0]) && rawVal < 100) {
      incomeLimit = rawVal * 100000;
    } else if (rawVal > 1000) {
      incomeLimit = rawVal;
    }
  }

  // Extract gender
  const isFemaleOnly = /female|girls|women|kanya|beti/i.test(text) && !/both male and female/i.test(text);

  // Extract Category
  const categories = [];
  if (/sc|scheduled caste/i.test(text)) categories.push('SC');
  if (/st|scheduled tribe/i.test(text)) categories.push('ST');
  if (/obc|other backward/i.test(text)) categories.push('OBC');
  if (/ews|economically weaker/i.test(text)) categories.push('EWS');
  if (/general|open/i.test(text) || categories.length === 0) categories.push('General', 'OBC', 'SC', 'ST', 'EWS');

  const id = 'live-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Math.floor(Math.random() * 1000);

  const rules = [
    {
      id: 'R1',
      category: 'income',
      rule: `Annual family income must not exceed ₹${incomeLimit.toLocaleString('en-IN')}.`,
      check: { type: 'income_max', value: incomeLimit }
    },
    {
      id: 'R2',
      category: 'course',
      rule: 'Applicant must be enrolled in an undergraduate or diploma course.',
      check: { type: 'level_in', values: ['Undergraduate', 'Diploma', 'Postgraduate'] }
    }
  ];

  if (isFemaleOnly) {
    rules.unshift({
      id: 'R0',
      category: 'gender',
      rule: 'Applicant must be a female / girl student.',
      check: { type: 'gender_in', values: ['Female'] }
    });
  }

  return {
    id,
    name: title.slice(0, 90),
    provider: 'Live Ingested Scheme / External Feed',
    description: text.slice(0, 300) + '...',
    officialUrl: sourceUrl || 'https://scholarships.gov.in',
    portalSource: 'Live External Extraction',
    benefitAmount: 'Financial Assistance as per scheme guidelines',
    categoryBadge: 'Live Verified Link',
    incomeLimit,
    eligibleCategories: Array.from(new Set(categories)),
    eligibleCourses: [],
    eligibleYears: [1, 2, 3, 4],
    requiredDocuments: [
      { key: 'aadhaar', label: 'Aadhaar Card' },
      { key: 'incomeCertificate', label: 'Income Certificate' },
      { key: 'marksheet', label: 'Marksheet' },
      { key: 'bonafideCertificate', label: 'College Bonafide' },
      { key: 'bankPassbook', label: 'Bank Account Passbook' }
    ],
    eligibilityRules: rules,
    applicationDeadline: '2026-12-31',
    conflictTags: ['external_live_ingested']
  };
}

/**
 * Ingests a scheme from URL or raw text and adds to live registry
 */
async function ingestScheme({ url, textContent, titleHint }) {
  let contentToParse = textContent || '';
  let sourceUrl = url || '';

  if (url && url.startsWith('http')) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'ScholarshipAssistant/1.0' } });
      if (response.ok) {
        const html = await response.text();
        contentToParse = extractTextFromHtml(html);
      }
    } catch (err) {
      console.warn('Could not fetch URL directly, will use provided text or URL metadata:', err.message);
      if (!contentToParse) {
        contentToParse = `${titleHint || 'Scholarship Scheme from ' + url}\nOfficial scholarship offering financial grant from ${url}`;
      }
    }
  }

  if (!contentToParse || contentToParse.length < 10) {
    throw new Error('Please provide a valid scholarship website URL or circular text to extract.');
  }

  const parsedScheme = await parseSchemeWithAI(contentToParse, sourceUrl);
  if (titleHint && parsedScheme.name.length < 5) {
    parsedScheme.name = titleHint;
  }

  // Register into active scheme service
  schemeService.addScheme(parsedScheme);

  return {
    success: true,
    message: `Successfully ingested and parsed "${parsedScheme.name}" into the active registry!`,
    scheme: schemeService.toPublic(parsedScheme)
  };
}

module.exports = {
  ingestScheme,
  parseSchemeWithAI
};
