# ClearSpeech (Next Version)

**Version:** `3.0.0` (defined in `backend/app/version.py`; align with `frontend/package.json` when you bump releases).

**Hosting:** On **Render free** tiers, services can **sleep** when idle. The **first request after inactivity may be slow** while the app wakes up—that is **normal** on free hosting, not a bug.

---

ClearSpeech is an AI communication assistant designed for people with communication difficulties (e.g. aphasia, non-native speakers, cognitive load).

This reposiotory contains the **next version of the application**, moving from a Streamlit prototype to a full web application.

---

## 💡 Project goal

The goal of ClearSpeech is to help users express their intended meaning clearly with minimal effort.

The system:
- accepts short or incomplete input
- proposes a clear sentence
- asks a simple confirmation
- iterates only if needed
- produces a final message ready to copy and use

---

## 🚀 Current status

This repository is under active development.

It represents the transition from:
- prototype (Streamlit app)
➡️ to
- structured web application (frontend + backend)

---

## 🔗 Existing working prototype

A working version is already available here:

👉 https://clearspeech-app-udbwmkg8k65nd6nahbvjip.streamlit.app

---

## 🧱 Architecture

The application is being rebuilt with:

- **Frontend:** Web app (React / Next.js)
- **Backend:** FastAPI (Python)
- **AI:** OpenAI API
- **Logic:** Custom communication assistant logic

---

## 📁 Project structure
backend/
app/
main.py
logic.py
schemas.py

frontend/
---

## 🧪 Backend tests

The API and core logic are covered by **pytest** tests under `backend/tests/`. They **do not call the OpenAI API** (the model and route handlers are mocked), so you can run them without an API key.

**Install dependencies** (once per environment):

```bash
cd backend
pip install -r requirements.txt
```

**Run tests** from the `backend/` folder:

```bash
python -m pytest -v
```

| File | What it covers |
|------|----------------|
| `tests/test_logic_helpers.py` | `confirmation_question_for_user` / `clarification_question_for_user` for `en`, `fr`, `de` |
| `tests/test_logic_model.py` | `propose_rewrite_and_question` and `propose_rewrite_after_clarification` with a patched `_call_model` |
| `tests/test_api.py` | `POST /rewrite` and `POST /clarify` via FastAPI `TestClient` with mocked logic |

`tests/conftest.py` adjusts the import path so `import app` works when pytest runs from `backend/`.

---

## 🧠 Key design principles

- low cognitive load
- simple interaction (yes / no)
- multilingual (EN / FR / DE)
- robust handling of unclear input
- accessibility-first design

---

## 🔮 Roadmap

- backend API (FastAPI)
- frontend interface
- user testing
- voice input (later stage)
- text-to-speech (accessibility)

---

## ⚠️ Note

This version is under construction.

For a stable experience, use the Streamlit version.

---

## 👤 Author

Julie Goulet drjuliegoulet@gmail.com