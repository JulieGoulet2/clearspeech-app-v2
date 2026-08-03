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
    assert result.startswith("Proposed sentence: I want to go to the doctor.")
    assert "Confirmation question: Is this what you mean?" in result


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
    assert result.startswith("Error:")
    assert "500" in result


@pytest.mark.anyio
async def test_rewrite_timeout_returns_error_text(mock_rewrite_timeout):
    result = await server._handle_rewrite("some message", "en")
    assert result.startswith("Error:")
    assert "backend" in result.lower()


@pytest.mark.anyio
async def test_rewrite_empty_message_returns_error():
    result = await server._handle_rewrite("", "en")
    assert "Error" in result
    assert "empty" in result.lower()


@pytest.mark.anyio
async def test_rewrite_tool_schema_includes_spanish():
    tools = await server.server.list_tools()
    rewrite_tool = next(tool for tool in tools if tool.name == "clearspeech_rewrite")
    language_hint = rewrite_tool.input_schema["properties"]["language_hint"]
    assert "es" in language_hint["enum"]
    assert "Spanish" in rewrite_tool.description
