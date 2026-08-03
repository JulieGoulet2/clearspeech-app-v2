# ClearSpeech

**AI communication assistant for people who struggle to find the right words.**

I built ClearSpeech because I need it myself. I have aphasia — a neurological condition that makes writing difficult. Every day, I struggle to compose emails, messages, and even short texts. ClearSpeech takes my broken, incomplete input and turns it into a clear sentence I can actually use.

Over 2 million people in Europe alone live with aphasia. Millions more have cognitive difficulties or language barriers that make written communication a daily challenge. Most AI tools assume you can write a perfect prompt. ClearSpeech assumes you can't — and that's the point.

---

## Live app

| | URL |
|---|---|
| **Frontend** | https://clearspeech-app-v2.vercel.app |
| **Backend API** | https://clearspeech-backend.onrender.com |

> The backend runs on Render free tier. The first request after a period of inactivity may take about one minute while the server wakes up. This is normal.

**Current version:** `3.0.0`

---

## What it looks like

![ClearSpeech in action](application.png)

*The user typed "I just want not go to you. Today" — the app suggested "I just do not want to go to you today." and asks for confirmation.*

---

## How it works

1. You write a short message — a few words is enough, spelling does not need to be perfect
2. The app proposes a clearer sentence and asks: "Is this what you mean?"
3. You answer Yes or No
4. If No, you add one short clarification — the app updates the suggestion
5. When you are happy, you see the final text and can copy it

**Languages supported:** English, French, German, Spanish

**Voice input (beta):** You can dictate your message instead of typing. The audio is transcribed by OpenAI Whisper.

**Team access:** Team members can enter a private access code in the app to remove the daily testing limit on their device. The code is validated by the backend before it is stored locally.

**Read aloud:** Any text in the app can be read aloud using the browser's text-to-speech.

---

## Architecture

```
frontend/    Next.js 14 (TypeScript) — deployed on Vercel
backend/     FastAPI (Python)        — deployed on Render
mcp-server/  MCP server (Python)     — runs locally, works with any MCP-compatible client
```

The frontend calls the backend API. The backend calls the OpenAI API (GPT-4.1-mini for text, Whisper-1 for audio). The MCP server wraps the same backend API so any MCP-compatible client (Claude Code, Claude Desktop, Cursor, Zed, etc.) can call ClearSpeech tools directly.

---

## Research

ClearSpeech is an active research project as well as a working tool.

In July 2026 it was submitted to Anthropic's **Claude Science — AI for Science** program, proposing a three-month study (September–December 2026) to:

- characterise aphasia-specific linguistic degradation patterns across English, French, German, and Spanish
- systematically evaluate how large language models recover intent from fragmented, incomplete input
- test adaptive, per-user prompting architectures — without model fine-tuning
- release an annotated multilingual aphasia corpus as an open benchmark (CC-BY-4.0)

The central hypothesis: for assistive tools, the right measure is not raw reconstruction accuracy but **confirmed communicative success** — a reconstruction the user has validated before it is used. This is why ClearSpeech always asks "Is this what you mean?" rather than answering directly.

The backend currently runs on OpenAI models. **Claude integration is the focus of ClearSpeech v2** and forms the core of the proposed research.

---

## MCP Server

The `mcp-server/` folder contains a lightweight [Model Context Protocol](https://modelcontextprotocol.io) server. It works with any MCP-compatible client (Claude Code, Claude Desktop, Cursor, Zed, and others) — no need to open the web app.

**Tools exposed:**

| Tool | What it does |
|---|---|
| `clearspeech_rewrite` | Rewrites a broken message into a clear sentence |
| `clearspeech_clarify` | Updates the rewrite based on a correction |
| `clearspeech_transcribe` | Transcribes audio (base64) using Whisper |

**Install:**

```bash
cd mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

**Configure your MCP client** — example for Claude Code, add to `.claude/settings.json` (use absolute paths):

```json
{
  "mcpServers": {
    "clearspeech": {
      "command": "/absolute/path/to/mcp-server/.venv/bin/python",
      "args": ["/absolute/path/to/mcp-server/server.py"],
      "env": {
        "CLEARSPEECH_API_URL": "https://clearspeech-backend.onrender.com"
      }
    }
  }
}
```

**Test:**

```bash
cd mcp-server
python -m pytest tests/ -v   # 15 tests, all pass
```

---

## Project structure

```
backend/
  app/
    main.py         API endpoints (FastAPI)
    logic.py        AI logic — calls to OpenAI
    schemas.py      Request and response models
    rate_limit.py   Rate limiting (50 requests/IP/day)
    version.py      Version number
  tests/
    test_api.py           API endpoint tests
    test_logic_helpers.py Logic helper tests
    test_logic_model.py   AI logic tests (mocked)
    test_rate_limit.py    Rate limit tests

frontend/
  app/
    page.tsx        Main page component
    layout.tsx      App layout
  lib/
    uiStrings.ts    All user-facing text (EN / FR / DE / ES)
    audioUtils.ts   Audio conversion utility (WAV encoding)
  __tests__/
    page.test.tsx       Core page behavior tests
    dictation.test.tsx  Voice input tests

mcp-server/
  server.py         MCP server — all tools in one file
  pyproject.toml    Dependencies and entry point
  .env.example      Environment variable template
  tests/
    conftest.py         Shared fixtures (mock backend, no real network)
    test_rewrite.py     clearspeech_rewrite tool tests
    test_clarify.py     clearspeech_clarify tool tests
    test_transcribe.py  clearspeech_transcribe tool tests
```

---

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
OPENAI_API_KEY=your-key-here
ADMIN_TOKEN=a-secret-token-for-unlimited-testing
TEAM_ACCESS_TOKEN=a-secret-token-for-team-members
```

Start the server:
```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If you want unlimited local access in the browser, enter the same `ADMIN_TOKEN` or `TEAM_ACCESS_TOKEN` in the app's **Team access** field. The frontend sends it to the backend for validation and then stores it locally on that device.

Start the dev server:
```bash
npm run dev
```

---

## Making team access work online

The team access code must be stored on the **backend deployment**, not in the frontend and not in Git.

### Backend deployment (Render)

In the Render environment variables for the backend service, set:

```text
OPENAI_API_KEY=your-openai-api-key
TEAM_ACCESS_TOKEN=your-secret-team-code
ADMIN_TOKEN=optional-second-secret-for-you
```

- `TEAM_ACCESS_TOKEN` is the code your friend or team members enter in the app
- `ADMIN_TOKEN` is optional and can be kept just for you
- after saving the variables in Render, redeploy the backend

### Frontend deployment (Vercel)

In the Vercel environment variables for the frontend, set only:

```text
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

Do **not** put `TEAM_ACCESS_TOKEN` or `ADMIN_TOKEN` in Vercel, because frontend variables are exposed to the browser.

### What happens in the app

1. A team member enters the code in the **Team access** box
2. The frontend sends that code to the backend `/validate-team-access` endpoint
3. If the code matches `TEAM_ACCESS_TOKEN` or `ADMIN_TOKEN`, the backend approves it
4. The browser stores the code locally on that device for later use

This means:

- the secret itself lives online on Render
- each team member saves it locally in their own browser after validation
- the secret is never published in the frontend bundle

---

## Running tests

### Backend tests

Tests do not call the OpenAI API — all AI calls are mocked.

```bash
cd backend
python -m pytest -v
```

| File | What it covers |
|------|----------------|
| `test_api.py` | `/rewrite`, `/clarify`, `/transcribe` endpoints |
| `test_logic_helpers.py` | Confirmation and clarification question strings (EN/FR/DE/ES) |
| `test_logic_model.py` | AI rewrite logic with mocked model output |
| `test_rate_limit.py` | 50 req/day limit, admin bypass, 24h reset, multi-user isolation |

### Frontend tests

```bash
cd frontend
npm test
```

---

## Rate limiting

Normal users are limited to **50 requests per IP per 24 hours** (about 15 complete conversations).

If you want unlimited access for local testing, set `ADMIN_TOKEN` or `TEAM_ACCESS_TOKEN` in the backend `.env`, then enter that code in the app's **Team access** field. The code is checked by the backend and never needs to be exposed as a `NEXT_PUBLIC_` frontend variable.

---

## Author

**Dr. Julie Goulet** — researcher, developer, and person with aphasia.

PhD in theoretical biophysics (computational neuroscience). Based in Munich, Germany. Building AI tools for people with disabilities.

- LinkedIn: [Julie Goulet](https://www.linkedin.com/in/julie-goulet-phd/)
- Email: drjuliegoulet@gmail.com

---

## License

MIT
