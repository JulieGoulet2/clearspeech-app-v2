# Tests for the clearspeech_rewrite MCP tool.
# Verifies happy path, correct request body, error handling, and input validation.
from __future__ import annotations

import pytest
import respx
import httpx

import server


@pytest.mark.anyio
async def test_rewrite_returns_labeled_output(mock_rewrite_success):
    result = await server._handle_rewrite("me tired want doctor", "en")
    assert len(result) == 1
    text = result[0].text
    assert text.startswith("Proposed sentence: I want to go to the doctor.")
    assert "Confirmation question: Is this what you mean?" in text


@pytest.mark.anyio
async def test_rewrite_sends_correct_json_body():
    with respx.mock as mock:
        route = respx.post(f"{server.API_URL}/rewrite").mock(
            return_value=httpx.Response(
                200,
                json={
                    "proposed_sentence": "Je veux aller chez le médecin.",
                    "confirmation_question": "Est-ce que c'est ce que tu veux dire?",
                },
            )
        )
        await server._handle_rewrite("moi vouloir médecin", "fr")
        assert route.called
        sent_body = route.calls[0].request.content
        import json
        body = json.loads(sent_body)
        assert body["message"] == "moi vouloir médecin"
        assert body["language_hint"] == "fr"


@pytest.mark.anyio
async def test_rewrite_backend_500_returns_error_text(mock_backend_500_rewrite):
    result = await server._handle_rewrite("some message", "en")
    assert len(result) == 1
    assert result[0].text.startswith("Error:")
    assert "500" in result[0].text


@pytest.mark.anyio
async def test_rewrite_timeout_returns_error_text(mock_rewrite_timeout):
    result = await server._handle_rewrite("some message", "en")
    assert len(result) == 1
    assert result[0].text.startswith("Error:")
    assert "backend" in result[0].text.lower()


@pytest.mark.anyio
async def test_rewrite_empty_message_returns_error():
    result = await server._handle_rewrite("", "en")
    assert len(result) == 1
    assert "Error" in result[0].text
    assert "empty" in result[0].text.lower()
