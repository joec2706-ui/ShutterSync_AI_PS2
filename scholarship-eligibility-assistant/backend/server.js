const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // project-root .env
require('dotenv').config();                                            // backend/.env (optional)

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const gemini = require('./services/geminiService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://localhost:5000').split(',').map((s) => s.trim());

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', rateLimit({
  windowMs: 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }
}));
app.use('/api', routes);
app.use('/api', notFound);

// Serve the built frontend if present (npm run build) so one process can run the whole app.
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nScholarship Eligibility API running on http://localhost:${PORT}`);
    console.log(gemini.isConfigured()
      ? `Mode: GEMINI AI (model: ${gemini.MODEL()})`
      : 'Mode: DEMO / RULE-BASED FALLBACK (GEMINI_API_KEY not set)\n');
  });
}

module.exports = app;
