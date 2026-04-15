from __future__ import annotations

import os
import time
from io import BytesIO
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

_client = None

def get_client():
    """Create the OpenAI client once and reuse it."""
    global _client
    if _client is None:
        api_key = os.environ.get("OPENAI_API_KEY", "").strip()

        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is missing from environment")

        print("[DEBUG] Creating OpenAI client, key prefix:", api_key[:7])

        _client = OpenAI(api_key=api_key)

    return _client


SYSTEM_PROMPT = """
You are an AI communication assistant for people with communication difficulties.

Your goal is to help the user express their intended meaning clearly.

The user may write a sentence or a short message in English, German, or French.

Language rule:
- Always detect the language of the user’s input.
- Always reply entirely in the same language as the user.
- This includes the proposed sentence and the confirmation question.
- Never use English unless the user wrote in English.

Language detection priority:
- Detect the language from the full sentence, not only the first word.
- If multiple languages are mixed, choose the dominant language of the sentence.
- The output MUST be entirely in that language.
- Never switch language during the interaction.

Consistency rule:
- Always use the SAME confirmation sentence in each language.

Rules:
- Preserve the user’s intended meaning.
- Never invent important missing details.
- Use short, simple, calm language.
- Ask only one question at a time.
- Accept incomplete or imperfect input.

Time handling:
- Pay attention to time indicators such as yesterday, tomorrow, later, next week, morgen, demain, hier, aujourd’hui.
- Use them to choose the correct tense.
- If time reference is unclear, ask a clarification question instead of guessing.

Uncertainty handling:
- Words like maybe, perhaps, vielleicht, peut-être indicate uncertainty.
- Do not turn uncertain statements into certain ones.
- Preserve uncertainty in the rewritten sentence.

Ambiguity rule:
- If there are two possible meanings, ask a clarification question instead of choosing one.

Figurative language and false friends:
- Be careful with idioms, figurative expressions, false friends, and direct translations from another language.
- If uncertain, ask for clarification instead of guessing.
- Example: "I want to become a beer" may mean "I want to have a beer."
- Example: "Das Projekt geht in den Süden" may mean "Das Projekt geht schief."

Mixed language handling:
- If the sentence mixes languages, detect the dominant language.
- Rewrite fully in ONE language only.

Missing context rule:
- If a sentence is incomplete (e.g. "doctor", "problem"), try to infer the most common real-world meaning.
- Prefer realistic everyday interpretations.
- But if more than one interpretation is reasonable, ask a clarification question instead of guessing.

Confirmation sentences:
- English: "Is this what you mean?"
- German: "Ist das, was du meinst?"
- French: "Est-ce que c’est ce que tu veux dire?"
- ALWAYS use these exact sentences.

Output format:
- First line: the proposed rewritten sentence.
- Second line: the confirmation question.
- Do not add any extra explanation.
""".strip()


def _call_model(user_input: str) -> str:
    """Call the model and return raw text."""
    t0 = time.perf_counter()
    response = get_client().responses.create(
        model="gpt-4.1-mini",
        instructions=SYSTEM_PROMPT,
        input=user_input,
        temperature=0.1,
    )
    elapsed = time.perf_counter() - t0
    print(f"[TIMING] OpenAI call: {elapsed:.2f}s")
    return response.output_text.strip()


def propose_rewrite_and_question(text: str, lang: str) -> tuple[str, str]:
    """
    First step:
    return (proposed_sentence, confirmation_question)
    """
    raw = _call_model(
        f"""Language hint: {lang}

User input:
{text}
"""
    )

    lines = [line.strip() for line in raw.splitlines() if line.strip()]

    if len(lines) >= 2:
        return lines[0], lines[1]

    if len(lines) == 1:
        return lines[0], confirmation_question_for_user(lang)

    return "", confirmation_question_for_user(lang)


def propose_rewrite_after_clarification(
    original_text: str, clarification: str, lang: str
) -> tuple[str, str]:
    """
    Second step after user clarification:
    return (proposed_sentence, confirmation_question)
    """
    prompt = f"""Language hint: {lang}

Original message:
{original_text}

User clarification:
{clarification}

Important:
- Detect the dominant language from the original message and clarification together.
- Use the language hint only as fallback.
- Reply in one language only.
- Use the exact confirmation sentence for that language.

Now provide:
1. a clearer rewritten sentence
2. the exact confirmation sentence
"""

    raw = _call_model(prompt)

    lines = [line.strip() for line in raw.splitlines() if line.strip()]

    if len(lines) >= 2:
        return lines[0], lines[1]

    if len(lines) == 1:
        return lines[0], confirmation_question_for_user(lang)

    return "", confirmation_question_for_user(lang)


def clarification_question_for_user(lang: str) -> str:
    questions = {
        "en": "What do you mean exactly?",
        "de": "Was meinst du genau?",
        "fr": "Qu’est-ce que tu veux dire exactement ?",
    }
    return questions.get(lang, questions["en"])


def confirmation_question_for_user(lang: str) -> str:
    questions = {
        "en": "Is this what you mean?",
        "de": "Ist das, was du meinst?",
        "fr": "Est-ce que c’est ce que tu veux dire?",
    }
    return questions.get(lang, questions["en"])


def transcribe_audio(audio_bytes: bytes, filename: str, language_hint: Optional[str] = None) -> str:
    if not audio_bytes:
        raise ValueError("Audio file is empty")

    print(
        "[TRANSCRIBE] helper received file:",
        filename,
        "size_bytes:",
        len(audio_bytes),
        "language_hint:",
        language_hint,
    )

    file_obj = BytesIO(audio_bytes)
    file_obj.name = filename or "recording.webm"

    options: dict = {
        "model": "whisper-1",
        "file": file_obj,
    }
    if language_hint in {"en", "fr", "de"}:
        options["language"] = language_hint

    t0 = time.perf_counter()
    transcript = get_client().audio.transcriptions.create(**options)
    elapsed = time.perf_counter() - t0
    print(f"[TRANSCRIBE] timing_s: {elapsed:.2f}")

    transcript_text = transcript.text if hasattr(transcript, "text") else str(transcript)
    transcript_text = (transcript_text or "").strip()
    print("[TRANSCRIBE] transcript_len:", len(transcript_text))

    if not transcript_text:
        raise RuntimeError("Speech was recorded, but no transcript was produced.")

    return transcript_text