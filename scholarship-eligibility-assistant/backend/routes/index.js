const express = require('express');
const gemini = require('../services/geminiService');
const { ok } = require('../utils/response');
const schemes = require('../controllers/schemesController');
const eligibility = require('../controllers/eligibilityController');
const documents = require('../controllers/documentsController');
const shortlist = require('../controllers/shortlistController');
const auth = require('../controllers/authController');
const simulation = require('../controllers/simulationController');
const chat = require('../controllers/chatController');
const wallet = require('../controllers/walletController');
const liveSync = require('../controllers/liveSyncController');

const router = express.Router();

router.get('/health', (req, res) => ok(res, {
  status: 'ok',
  time: new Date().toISOString(),
  mode: gemini.isConfigured() ? 'gemini' : 'rule-based',
  geminiConfigured: gemini.isConfigured(),
  model: gemini.isConfigured() ? gemini.MODEL() : null
}));

// System Telemetry
router.get('/system/status', liveSync.systemStatus);

// Auth
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', auth.me);
router.post('/auth/profile', auth.updateProfile);

// Schemes & Live Sync / Ingest
router.get('/schemes', schemes.list);
router.get('/schemes/:id', schemes.getOne);
router.post('/schemes/sync', liveSync.syncPortals);
router.post('/schemes/ingest-url', liveSync.ingestScheme);

// Eligibility Core
router.post('/eligibility/evaluate', eligibility.evaluate);
router.post('/eligibility/evaluate-all', eligibility.evaluateAll);

// What-If Simulator & Opportunity Unlock Engine
router.post('/eligibility/what-if', simulation.simulate);
router.post('/eligibility/unlocks', simulation.unlockRecommendations);
router.post('/eligibility/gap/:schemeId', simulation.schemeGap);

// Documents & Evidence Wallet
router.post('/documents/upload', documents.upload);
router.post('/wallet/conflicts', wallet.detectConflicts);
router.post('/wallet/sync', wallet.syncWallet);

// AI Co-Pilot Chat
router.post('/chat', chat.chat);

// Shortlist
router.get('/shortlist/:userId', shortlist.list);
router.post('/shortlist', shortlist.add);
router.delete('/shortlist/:id', shortlist.remove);

module.exports = router;

