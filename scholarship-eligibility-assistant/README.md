# Scholarship & Scheme Eligibility Assistant

An AI-powered assistant that matches a student's profile against a curated set of scholarship / scheme rules and
explains every decision with the **exact rule clause** behind it.

Each scheme is classified as **✓ ELIGIBLE**, **✕ NOT ELIGIBLE** or **? NEEDS MORE INFORMATION**, with missing
information, missing documents and next steps.

> **Demo Scholarship Dataset.** All 10 schemes are fictional sample data created for this hackathon project.
> They are *not* official government rules. Results are decision support only — always verify the latest official guidelines.

---

## Features

- Profile form with frontend **and** backend validation; optional fields clearly marked; "Load Demo Profile" (3 scenarios)
- 10 demo schemes with explicit rule clauses (`R1`, `R2`, …)
- **Gemini** reasoning over the supplied rule text only, returning validated structured JSON
- **Deterministic rule-based fallback** (same rule IDs & citations) — the app works with no API key or when Gemini fails
- Decision principle: *known failure → NOT ELIGIBLE · all rules pass → ELIGIBLE · required info unknown → NEEDS MORE INFORMATION*
- Results dashboard (counts, filters, text status labels — not colour only), scheme detail page with rule-by-rule PASS/FAIL/UNKNOWN
- Shortlist (localStorage, mirrored best-effort to the backend API)
- Document status checklist + optional upload (PDF / TXT / PNG / JPG, 5 MB) with text extraction
- Helmet, CORS allow-list, body-size limits, rate limiting, upload validation, input sanitisation; API key never reaches the browser

## How the AI is kept honest

1. The scheme's structured rules (`backend/data/schemes.json`) are the source of truth.
2. The prompt supplies only the profile + rule text and forbids inventing rules, limits, deadlines or documents.
3. Gemini's JSON is validated. Rule text in citations is replaced with the real rule text, unknown rule IDs are dropped,
   and any per-rule verdict that contradicts the deterministic engine is overridden (`meta.engineOverrides`).
4. Missing information and missing documents are always derived from the dataset, never from the model.
5. Malformed JSON, timeouts, quota/auth errors or no key → automatic fallback to the rule engine.

## Architecture

```
React (Vite, Tailwind)  ──/api──▶  Express
                                    ├─ routes → controllers
                                    ├─ services/ruleEngine.js        deterministic evaluation (fallback + cross-check)
                                    ├─ services/geminiService.js     Gemini REST call, prompt, JSON validation
                                    ├─ services/evaluationService.js Gemini first, fallback on any failure
                                    ├─ services/schemeService.js     data access (local JSON; swap for a DB later)
                                    └─ data/schemes.json             Demo Scholarship Dataset
```

## Folder structure

```
scholarship-eligibility-assistant/
├── README.md  .env.example  .gitignore  package.json
├── backend/
│   ├── server.js
│   ├── routes/ controllers/ middleware/ utils/
│   ├── services/ (geminiService, ruleEngine, evaluationService, schemeService)
│   ├── data/schemes.json
│   └── tests/ (engine.test.js, gemini.test.js)
└── frontend/
    ├── index.html  vite.config.js  tailwind.config.js
    └── src/ (pages, components, context, hooks, services, utils, App.jsx, main.jsx)
```

## Requirements

- Node.js **18+** (tested on Node 22) and npm

## Installation & running

### Option 1 — one command from the project root

```bash
cp .env.example .env        # Windows (cmd): copy .env.example .env
# edit .env and paste your key after GEMINI_API_KEY=   (optional — see Fallback mode)
npm install                 # installs root + backend + frontend dependencies
npm run dev                 # starts backend (5000) and frontend (5173)
```

Open **http://localhost:5173**

### Option 2 — separate terminals

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

### Option 3 — production-style single server

```bash
npm install
npm run build      # builds frontend/dist
npm start          # Express serves the API and the built frontend on http://localhost:5000
```

## Environment variables

Create `.env` in the project root (or in `backend/`) from `.env.example`:

| Variable         | Required | Description                                                  |
|------------------|----------|--------------------------------------------------------------|
| `GEMINI_API_KEY` | No       | Google Gemini API key. Without it the app uses fallback mode |
| `PORT`           | No       | Backend port (default `5000`)                                |
| `GEMINI_MODEL`   | No       | Gemini model name (default `gemini-2.5-flash`)               |
| `CORS_ORIGINS`   | No       | Comma-separated allowed origins (defaults to local dev URLs) |

If you change `PORT`, also update the proxy target in `frontend/vite.config.js`.

## How to get a Gemini API key

1. Go to <https://aistudio.google.com/app/apikey> and sign in with a Google account.
2. Click **Create API key** (the free tier is sufficient).
3. Paste it into `.env`: `GEMINI_API_KEY=your_key`. Restart the backend.

The backend prints its active mode on start-up, and `GET /api/health` reports it.

## Fallback mode

If `GEMINI_API_KEY` is missing, or Gemini fails (network, quota, bad JSON), the backend uses the deterministic rule engine.
Nothing crashes: the UI shows a **"Demo / Rule-based evaluation"** banner and each result carries
`meta.mode = "rule-based"` plus a `fallbackReason`. After the first fatal Gemini error (auth/quota/network) the rest of the
batch skips Gemini so the response stays fast.

## API

All responses: `{ "success": true, "data": … }` or `{ "success": false, "error": { "code", "message", "details?" } }`.

| Method | Endpoint                        | Purpose                                                   |
|--------|---------------------------------|-----------------------------------------------------------|
| GET    | `/api/health`                   | Status + active mode (`gemini` / `rule-based`)            |
| GET    | `/api/schemes`                  | All demo schemes                                          |
| GET    | `/api/schemes/:id`              | One scheme (404 if unknown)                               |
| POST   | `/api/eligibility/evaluate`     | Body `{ profile, schemeId }` → one evaluation             |
| POST   | `/api/eligibility/evaluate-all` | Body `{ profile }` → all evaluations + counts + mode      |
| POST   | `/api/documents/upload`         | multipart: `documentType`, `file` (pdf/txt/png/jpg ≤ 5MB) |
| GET    | `/api/shortlist/:userId`        | Shortlist (demo user id: `demo-user`)                     |
| POST   | `/api/shortlist`                | Body `{ userId?, schemeId, status? }`                     |
| DELETE | `/api/shortlist/:id`            | `id` = `userId__schemeId`                                 |

Example:

```bash
curl -s -X POST http://localhost:5000/api/eligibility/evaluate-all -H "Content-Type: application/json" -d '{"profile":{"age":20,"stateOfResidence":"Maharashtra","domicileState":"Maharashtra","category":"OBC","course":"B.E. Computer Engineering","courseLevel":"Undergraduate","yearOfStudy":3,"annualIncome":200000,"disability":"No"}}'
```

## Demo workflow (for judges)

1. Open the app → **Check My Eligibility**.
2. Click **Scenario A: OBC engineering student** → **Check Eligibility**.
   Expected: **5 eligible · 4 not eligible · 1 needs information** (the Women in STEM grant needs gender).
   - OBC Higher Education Assistance → ✕ NOT ELIGIBLE, cites `[R2] Applicant's annual family income should not exceed ₹1,50,000.`
3. Click **View Details** on any card for the rule-by-rule PASS / FAIL / UNKNOWN breakdown, citations and next steps.
4. **Save to shortlist**, open **My Shortlist**, remove an item.
5. Back on the profile page load **Scenario B** (income ₹8,00,000 → mostly NOT ELIGIBLE) and
   **Scenario C** (domicile / income / gender missing → many NEEDS MORE INFORMATION with questions and required documents).
6. Optional: upload `.txt`/`.pdf` income certificate text — income is detected and can be applied to the profile.

## Tests

```bash
npm test      # engine + validation tests, and Gemini integration tests (stubbed fetch — no key/network needed)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach the server" | Start the backend (`npm run dev` / `cd backend && npm run dev`) and check it runs on port 5000 |
| Banner says "Demo / Rule-based" but a key is set | Key must be in `.env` (root or `backend/`), no quotes/spaces; restart backend. Check `/api/health` and the backend log for the Gemini error (403 = invalid key, 429 = quota) |
| Port already in use | Set `PORT` in `.env` and update the proxy in `frontend/vite.config.js` |
| `npm install` at root didn't install sub-projects | Run `npm --prefix backend install && npm --prefix frontend install` |
| Upload rejected | Only PDF, TXT, PNG, JPG up to 5 MB; PDFs must be real PDFs |

## Future improvements

Real database + accounts, official scheme ingestion with source links and deadlines, OCR for scanned documents,
multi-language UI, email reminders for deadlines, caching of AI evaluations.
