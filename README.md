# ClearSpeech (Next Version)

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