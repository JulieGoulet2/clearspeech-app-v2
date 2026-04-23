# Tests for the clearspeech_transcribe MCP tool.
# Verifies audio decoding, multipart upload format, MIME types, and error handling.
from __future__ import annotations

import base64

import httpx
import pytest
import respx

import server


FAKE_AUDIO_B64 = base64.b64encode(b"fake audio bytes").decode()


@pytest.mark.anyio
async def test_transcribe_returns_transcript_label(mock_transcribe_success):
    result = await server._handle_transcribe(FAKE_AUDIO_B64, "recording.webm", "en")
    assert len(result) == 1
    assert result[0].text == "Transcript: I want to sleep."


@pytest.mark.anyio
async def test_transcribe_sends_multipart_form():
    with respx.mock:
        route = respx.post(f"{server.API_URL}/transcribe").mock(
            return_value=httpx.Response(200, json={"transcript": "hello"})
        )
        await server._handle_transcribe(FAKE_AUDIO_B64, "recording.webm", "en")
        assert route.called
        content_type = route.calls[0].request.headers.get("content-type", "")
        assert "multipart/form-data" in content_type


@pytest.mark.anyio
async def test_transcribe_mime_type_from_filename():
    cases = [
        ("recording.webm", "audio/webm"),
        ("audio.mp3", "audio/mpeg"),
        ("voice.wav", "audio/wav"),
        ("clip.m4a", "audio/mp4"),
        ("file.bin", "application/octet-stream"),
    ]
    for filename, expected_mime in cases:
        with respx.mock:
            route = respx.post(f"{server.API_URL}/transcribe").mock(
                return_value=httpx.Response(200, json={"transcript": "ok"})
            )
            await server._handle_transcribe(FAKE_AUDIO_B64, filename, "en")
            request_body = route.calls[0].request.content.decode("latin-1")
            assert expected_mime in request_body, f"Expected {expected_mime} for {filename}"


@pytest.mark.anyio
async def test_transcribe_invalid_base64_returns_error():
    with respx.mock:
        route = respx.post(f"{server.API_URL}/transcribe").mock(
            return_value=httpx.Response(200, json={"transcript": "ok"})
        )
        result = await server._handle_transcribe("not-valid-base64!!!", "recording.webm", "en")
        assert len(result) == 1
        assert "Error" in result[0].text
        assert "base64" in result[0].text.lower()
        assert not route.called


@pytest.mark.anyio
async def test_transcribe_backend_400_returns_error(mock_backend_400_transcribe):
    result = await server._handle_transcribe(FAKE_AUDIO_B64, "recording.webm", "en")
    assert len(result) == 1
    assert result[0].text.startswith("Error:")
    assert "400" in result[0].text
