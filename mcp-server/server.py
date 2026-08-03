"""MCP server that wraps the ClearSpeech backend API for aphasia communication."""
from __future__ import annotations

import base64
import os
from typing import Annotated, Literal

import httpx
from dotenv import load_dotenv
from pydantic import Field
from mcp.server.mcpserver import MCPServer

load_dotenv()

API_URL = os.getenv(
    "CLEARSPEECH_API_URL", "https://clearspeech-backend.onrender.com"
).rstrip("/")

server = MCPServer("clearspeech")
LanguageHint = Literal["en", "fr", "de", "es"]

_MIME_TYPES: dict[str, str] = {
    ".webm": "audio/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
}


async def _handle_rewrite(message: str, language_hint: LanguageHint) -> str:
    if not message.strip():
        return "Error: 'message' must not be empty."
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{API_URL}/rewrite",
                json={"message": message, "language_hint": language_hint},
            )
        if response.status_code != 200:
            detail = response.json().get("detail", "Unknown error")
            return f"Error: Backend returned {response.status_code}. {detail}"
        data = response.json()
        return (
            f"Proposed sentence: {data['proposed_sentence']}\n"
            f"Confirmation question: {data['confirmation_question']}"
        )
    except Exception as e:
        return f"Error: Could not reach the ClearSpeech backend. {e}"


async def _handle_clarify(
    original_message: str, clarification: str, language_hint: LanguageHint
) -> str:
    if not original_message.strip():
        return "Error: 'original_message' must not be empty."
    if not clarification.strip():
        return "Error: 'clarification' must not be empty."
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{API_URL}/clarify",
                json={
                    "original_message": original_message,
                    "clarification": clarification,
                    "language_hint": language_hint,
                },
            )
        if response.status_code != 200:
            detail = response.json().get("detail", "Unknown error")
            return f"Error: Backend returned {response.status_code}. {detail}"
        data = response.json()
        return (
            f"Proposed sentence: {data['proposed_sentence']}\n"
            f"Confirmation question: {data['confirmation_question']}"
        )
    except Exception as e:
        return f"Error: Could not reach the ClearSpeech backend. {e}"


async def _handle_transcribe(
    audio_base64: str, filename: str, language_hint: LanguageHint
) -> str:
    try:
        audio_bytes = base64.b64decode(audio_base64)
    except Exception:
        return "Error: 'audio_base64' is not valid base64-encoded data."

    ext = os.path.splitext(filename)[1].lower()
    mime_type = _MIME_TYPES.get(ext, "application/octet-stream")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{API_URL}/transcribe",
                files={"audio": (filename, audio_bytes, mime_type)},
                data={"language_hint": language_hint},
            )
        if response.status_code != 200:
            detail = response.json().get("detail", "Unknown error")
            return f"Error: Backend returned {response.status_code}. {detail}"
        data = response.json()
        return f"Transcript: {data['transcript']}"
    except Exception as e:
        return f"Error: Could not reach the ClearSpeech backend. {e}"


@server.tool(
    name="clearspeech_rewrite",
    description=(
        "Rewrites a broken, incomplete, or grammatically imperfect message into a clear "
        "sentence. Designed for people with aphasia or other communication difficulties. "
        "Returns a proposed rewrite and a confirmation question. Use this as the first step "
        "whenever the user's message is unclear or incomplete. Supports English (en), French "
        "(fr), German (de), and Spanish (es)."
    ),
)
async def clearspeech_rewrite(
    message: Annotated[
        str,
        Field(
            min_length=1,
            description="The user's raw, incomplete, or broken message to rewrite",
        ),
    ],
    language_hint: Annotated[
        LanguageHint,
        Field(description="Language code: en (English), fr (French), de (German), es (Spanish)"),
    ] = "en",
) -> str:
    return await _handle_rewrite(message, language_hint)


@server.tool(
    name="clearspeech_clarify",
    description=(
        "Updates a ClearSpeech rewrite proposal based on the user's clarification. "
        "Call this after clearspeech_rewrite when the user indicates the proposal was not "
        "right and provides a correction or extra information. Returns a revised proposed "
        "sentence and a new confirmation question."
    ),
)
async def clearspeech_clarify(
    original_message: Annotated[
        str,
        Field(
            min_length=1,
            description="The user's original broken message passed to clearspeech_rewrite",
        ),
    ],
    clarification: Annotated[
        str,
        Field(min_length=1, description="The user's correction or extra information"),
    ],
    language_hint: Annotated[
        LanguageHint,
        Field(description="Language code: en, fr, de, or es"),
    ] = "en",
) -> str:
    return await _handle_clarify(original_message, clarification, language_hint)


@server.tool(
    name="clearspeech_transcribe",
    description=(
        "Transcribes an audio recording to text using the ClearSpeech backend (OpenAI Whisper). "
        "Pass base64-encoded audio bytes. Returns the transcript as plain text. Supports webm, "
        "mp3, wav, and m4a. Pair with clearspeech_rewrite afterwards to clarify the transcript."
    ),
)
async def clearspeech_transcribe(
    audio_base64: Annotated[str, Field(description="Base64-encoded audio file content")],
    filename: Annotated[
        str,
        Field(description="Original filename with extension (for example recording.webm)"),
    ] = "recording.webm",
    language_hint: Annotated[
        LanguageHint,
        Field(description="Expected language of the audio"),
    ] = "en",
) -> str:
    return await _handle_transcribe(audio_base64, filename, language_hint)


def main() -> None:
    server.run()


if __name__ == "__main__":
    main()
