const gemini = require('./geminiService');
const schemeService = require('./schemeService');
const ruleEngine = require('./ruleEngine');
const simulation = require('./simulationService');

function buildChatSystemInstruction(profile, schemes, results) {
  return `You are "Scholarship Co-Pilot", an expert, friendly, and honest eligibility assistant for Indian scholarships and student welfare schemes.
You have access to the applicant's profile and current eligibility evaluation against all 10 demo schemes.

APPLICANT PROFILE:
${JSON.stringify(profile || {}, null, 2)}

CURRENT EVALUATIONS SUMMARY:
${results ? JSON.stringify({
    counts: results.counts,
    schemes: results.results?.map(r => ({
      id: r.schemeId,
      name: r.schemeName,
      status: r.status,
      summary: r.summary,
      missingInfo: r.missingInformation,
      missingDocs: r.missingDocuments
    }))
  }, null, 2) : 'Profile not fully evaluated yet.'}

SCHEME RULES DATASET:
${JSON.stringify(schemes.map(s => ({
    id: s.id,
    name: s.name,
    incomeLimit: s.incomeLimit,
    rules: s.eligibilityRules.map(r => `[${r.id}] ${r.rule}`),
    docs: s.requiredDocuments.map(d => d.label)
  })), null, 2)}

GUIDELINES:
1. Ground every answer strictly on the rules and data provided above. Never invent requirements or government dates.
2. If asked "Why am I not eligible for X?", cite the exact rule ID [R1, R2, ...] and explain the difference between the applicant's value and the limit.
3. If asked about "What-If" scenarios (e.g., "What if my income is ₹2.5L?"), explain which schemes would change status and why.
4. Keep answers concise, actionable, and encouraging with bullet points.
5. Remind students that all schemes here are demo schemes and to always verify official government portals.`;
}

function ruleBasedChatResponse(message, profile, schemes, results) {
  const q = String(message || '').toLowerCase();

  // Check if asking about a specific scheme
  const matchedScheme = schemes.find(s => 
    q.includes(s.name.toLowerCase()) || 
    q.includes(s.id.toLowerCase()) ||
    (s.id === 'mh-student-support' && (q.includes('maharashtra') || q.includes('mh'))) ||
    (s.id === 'women-in-stem' && (q.includes('women') || q.includes('stem'))) ||
    (s.id === 'national-merit' && q.includes('merit')) ||
    (s.id === 'sc-st-education-support' && (q.includes('sc') || q.includes('st'))) ||
    (s.id === 'obc-higher-education' && q.includes('obc')) ||
    (s.id === 'inclusive-education-support' && (q.includes('disability') || q.includes('pwd')))
  );

  if (matchedScheme) {
    const ev = results?.results?.find(r => r.schemeId === matchedScheme.id) || ruleEngine.evaluateScheme(matchedScheme, profile);
    let reply = `### ${matchedScheme.name}\n\n`;
    reply += `**Current Status:** \`${ev.status.replace(/_/g, ' ')}\`\n\n`;
    reply += `**Summary:** ${ev.summary}\n\n`;
    reply += `**Key Rules:**\n` + matchedScheme.eligibilityRules.map(r => `- **[${r.id}]** ${r.rule}`).join('\n') + `\n\n`;
    
    if (ev.missingInformation?.length > 0) {
      reply += `**Missing Information Needed:**\n` + ev.missingInformation.map(m => `- ${m.field}: "${m.question}"`).join('\n') + `\n\n`;
    }
    if (ev.missingDocuments?.length > 0) {
      reply += `**Required Documents:** ${ev.missingDocuments.join(', ')}\n\n`;
    }
    return reply;
  }

  // Check if asking about what-if or unlocks
  if (q.includes('what if') || q.includes('unlock') || q.includes('highest impact') || q.includes('action') || q.includes('improve')) {
    const unlocks = simulation.getOpportunityUnlocks(profile);
    if (unlocks.topAction) {
      return `### 🎯 Highest-Impact Recommendation\n\n` +
        `**Action:** ${unlocks.topAction.title}\n\n` +
        `${unlocks.topAction.description}\n\n` +
        `**Impact:** Unlocks **${unlocks.topAction.unlockedCount} scholarship(s)** and resolves **${unlocks.topAction.resolvedCount} requirement(s)**.\n\n` +
        `You can use our **What-If Eligibility Simulator** in the top navigation to test this scenario live!`;
    }
  }

  // Check if asking about income limits
  if (q.includes('income') || q.includes('salary') || q.includes('lakh')) {
    let reply = `### Family Income Limits Overview\n\n`;
    schemes.forEach(s => {
      reply += `- **${s.name}**: Max ₹${(s.incomeLimit || 0).toLocaleString('en-IN')}\n`;
    });
    reply += `\nYour current recorded profile income is **₹${Number(profile.annualIncome || 0).toLocaleString('en-IN')}**.`;
    return reply;
  }

  // Check if asking about documents
  if (q.includes('document') || q.includes('certificate') || q.includes('upload') || q.includes('wallet')) {
    return `### 📄 Required Documents Guide\n\n` +
      `Most scholarships require:\n` +
      `1. **Income Certificate** (Issued by Revenue Authority / Tehsildar)\n` +
      `2. **Domicile / Residence Certificate** (Proves state residency)\n` +
      `3. **Caste Certificate** (For OBC/SC/ST reservations)\n` +
      `4. **Bonafide Student Certificate** (From your current College)\n` +
      `5. **Marksheets & Aadhaar**\n\n` +
      `You can upload your documents into your **Evidence Wallet** to automatically detect and extract income/domicile data.`;
  }

  // General summary response
  if (results) {
    return `### Your Eligibility Overview\n\n` +
      `- ✅ **Eligible Schemes:** ${results.counts.ELIGIBLE}\n` +
      `- ❓ **Needs More Information:** ${results.counts.NEEDS_MORE_INFORMATION}\n` +
      `- ❌ **Not Eligible:** ${results.counts.NOT_ELIGIBLE}\n\n` +
      `Ask me about any specific scholarship (e.g. *"Why am I not eligible for Maharashtra Student Support?"*) or try *"What is my highest impact next action?"*!`;
  }

  return `Hello! I'm your Scholarship Co-Pilot. You can ask me:\n- *"Why am I not eligible for OBC Higher Education?"*\n- *"What documents do I need?"*\n- *"What happens if my income is ₹2,00,000?"*\n- *"Which schemes match an engineering student in Maharashtra?"*`;
}

async function answerChat({ message, history = [], profile = {}, results = null }) {
  const schemes = schemeService.getAll();

  if (gemini.isConfigured()) {
    try {
      const systemInstruction = buildChatSystemInstruction(profile, schemes, results);
      
      const contents = [];
      // Include up to 4 recent message turns
      const recentHistory = history.slice(-4);
      recentHistory.forEach(h => {
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        });
      });
      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${gemini.MODEL()}:generateContent`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY.trim()
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
        if (text && text.trim()) {
          return {
            reply: text.trim(),
            mode: 'gemini'
          };
        }
      }
    } catch (err) {
      console.warn('[chat] Gemini error, falling back to rule reasoning:', err.message);
    }
  }

  // Fallback to intelligent rule-based chat
  const reply = ruleBasedChatResponse(message, profile, schemes, results);
  return {
    reply,
    mode: 'rule-based'
  };
}

module.exports = {
  answerChat
};
