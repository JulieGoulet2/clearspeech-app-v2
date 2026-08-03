# Tests for the clearspeech_clarify MCP tool.
# Verifies happy path, correct request body, error handling, and input validation.
from __future__ import annotations

import json

import httpx
import pytest
import respx

import server


@pytest.mark.anyio
async def test_clarify_returns_labeled_output(mock_clarify_success):
    result = await server._handle_clarify("me tired want doctor", "tomorrow morning", "en")
    assert "Proposed sentence:" in result
    assert "Confirmation question:" in result


@pytest.mark.anyio
async def test_clarify_sends_correct_json_body():
    with respx.mock:
        route = respx.post(f"{server.API_URL}/clarify").mock(
            return_value=httpx.Response(
                200,
                json={
                    "proposed_sentence": "I want an appointment tomorrow morning.",
                    "confirmation_question": "Is this what you mean?",
                },
            )
        )
        await server._handle_clarify("me want doctor", "tomorrow morning", "en")
        assert route.called
        body = json.loads(route.calls[0].request.content)
        assert body["original_message"] == "me want doctor"
        assert body["clarification"] == "tomorrow morning"
        assert body["language_hint"] == "en"


@pytest.mark.anyio
async def test_clarify_backend_500_returns_error_text(mock_backend_500_clarify):
    result = await server._handle_clarify("some message", "some clarification", "en")
    assert result.startswith("Error:")
    assert "500" in result


@pytest.mark.anyio
async def test_clarify_empty_original_returns_error():
    result = await server._handle_clarify("", "some clarification", "en")
    assert "Error" in result
    assert "empty" in result.lower()


@pytest.mark.anyio
async def test_clarify_empty_clarification_returns_error():
    result = await server._handle_clarify("some message", "", "en")
    assert "Error" in result
    assert "empty" in result.lower()
