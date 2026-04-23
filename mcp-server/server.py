"""MCP server that wraps the ClearSpeech backend API for aphasia communication."""
from __future__ import annotations

import asyncio
import base64
import os

import httpx
from dotenv import load_dotenv
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

load_dotenv()

API_URL = os.getenv(
    "CLEARSPEECH_API_URL", "https://clearspeech-backend.onrender.com"
).rstrip("/")

server = Server("clearspeech")

_MIME_TYPES: dict[str, str] = {
    ".webm": "audio/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
}


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="clearspeech_rewrite",
            description=(
                "Rewrites a broken, incomplete, or grammatically imperfect message "
                "into a clear sentence. Designed for people with aphasia or other "
                "communication difficulties. Returns a proposed rewrite and a "
                "confirmation question. Use this as the first step whenever the "
                "user's message is unclear or incomplete. "
                "Supports English (en), French (fr), and German (de)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The user's raw, incomplete, or broken message to rewrite",
                        "minLength": 1,
                    },
                    "language_hint": {
                        "type": "string",
                        "enum": ["en", "fr", "de"],
                        "description": "Language code: en (English), fr (French), de (German)",
                        "default": "en",
                    },
                },
                "required": ["message", "language_hint"],
            },
        ),
        Tool(
            name="clearspeech_clarify",
            description=(
                "Updates a ClearSpeech rewrite proposal based on the user's "
                "clarification. Call this after clearspeech_rewrite when the user "
                "indicates the proposal was not right and provides a correction or "
                "extra information. Returns a revised proposed sentence and a new "
                "confirmation question."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "original_message": {
                        "type": "string",
                        "description": "The user's original broken message passed to clearspeech_rewrite",
                        "minLength": 1,
                    },
                    "clarification": {
                        "type": "string",
                        "description": "The user's correction or extra information",
                        "minLength": 1,
                    },
                    "language_hint": {
                        "type": "string",
                        "enum": ["en", "fr", "de"],
                        "description": "Language code: en, fr, or de",
                        "default": "en",
                    },
                },
                "required": ["original_message", "clarification", "language_hint"],
            },
        ),
        Tool(
            name="clearspeech_transcribe",
            description=(
                "Transcribes an audio recording to text using the ClearSpeech "
                "backend (OpenAI Whisper). Pass base64-encoded audio bytes. "
                "Returns the transcript as plain text. Supports webm, mp3, wav, m4a. "
                "Pair with clearspeech_rewrite afterwards to clarify the transcript."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "audio_base64": {
                        "type": "string",
                        "description": "Base64-encoded audio file content",
                    },
                    "filename": {
                        "type": "string",
                        "description": "Original filename with extension (e.g. recording.webm)",
                        "default": "recording.webm",
                    },
                    "language_hint": {
                        "type": "string",
                        "enum": ["en", "fr", "de"],
                        "description": "Expected language of the audio",
                        "default": "en",
                    },
                },
                "required": ["audio_base64"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "clearspeech_rewrite":
        return await _handle_rewrite(
            message=arguments.get("message", ""),
            language_hint=arguments.get("language_hint", "en"),
        )
    if name == "clearspeech_clarify":
        return await _handle_clarify(
            original_message=arguments.get("original_message", ""),
            clarification=arguments.get("clarification", ""),
            language_hint=arguments.get("language_hint", "en"),
        )
    if name == "clearspeech_transcribe":
        return await _handle_transcribe(
            audio_base64=arguments.get("audio_base64", ""),
            filename=arguments.get("filename", "recording.webm"),
            language_hint=arguments.get("language_hint", "en"),
        )
    return [TextContent(type="text", text=f"Error: Unknown tool '{name}'")]


async def _handle_rewrite(message: str, language_hint: str) -> list[TextContent]:
    if not message.strip():
        return [TextContent(type="text", text="Error: 'message' must not be empty.")]
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{API_URL}/rewrite",
                json={"message": message, "language_hint": language_hint},
            )
        if response.status_code != 200:
            detail = response.json().get("detail", "Unknown error")
            return [TextContent(type="text", text=f"Error: Backend returned {response.status_code}. {detail}")]
        data = response.json()
        return [TextContent(
            type="text",
            text=f"Proposed sentence: {data['proposed_sentence']}\nConfirmation question: {data['confirmation_question']}",
        )]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: Could not reach the ClearSpeech backend. {e}")]


async def _handle_clarify(
    original_message: str, clarification: str, language_hint: str
) -> list[TextContent]:
    if not original_message.strip():
        return [TextContent(type="text", text="Error: 'original_message' must not be empty.")]
    if not clarification.strip():
        return [TextContent(type="text", text="Error: 'clarification' must not be empty.")]
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
            return [TextContent(type="text", text=f"Error: Backend returned {response.status_code}. {detail}")]
        data = response.json()
        return [TextContent(
            type="text",
            text=f"Proposed sentence: {data['proposed_sentence']}\nConfirmation question: {data['confirmation_question']}",
        )]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: Could not reach the ClearSpeech backend. {e}")]


async def _handle_transcribe(
    audio_base64: str, filename: str, language_hint: str
) -> list[TextContent]:
    try:
        audio_bytes = base64.b64decode(audio_base64)
    except Exception:
        return [TextContent(type="text", text="Error: 'audio_base64' is not valid base64-encoded data.")]

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
            return [TextContent(type="text", text=f"Error: Backend returned {response.status_code}. {detail}")]
        data = response.json()
        return [TextContent(type="text", text=f"Transcript: {data['transcript']}")]
    except Exception as e:
        return [TextContent(type="text", text=f"Error: Could not reach the ClearSpeech backend. {e}")]


async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
