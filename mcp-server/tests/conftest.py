# Shared pytest fixtures for all MCP server tests.
# Uses respx to intercept httpx calls so tests never touch the real backend.
from __future__ import annotations

import httpx
import pytest
import respx

TEST_API_URL = "http://test-backend"


@pytest.fixture(autouse=True)
def set_api_url(monkeypatch):
    monkeypatch.setenv("CLEARSPEECH_API_URL", TEST_API_URL)
    import server
    server.API_URL = TEST_API_URL


@pytest.fixture
def mock_rewrite_success():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/rewrite").mock(
            return_value=httpx.Response(
                200,
                json={
                    "proposed_sentence": "I want to go to the doctor.",
                    "confirmation_question": "Is this what you mean?",
                },
            )
        )
        yield


@pytest.fixture
def mock_clarify_success():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/clarify").mock(
            return_value=httpx.Response(
                200,
                json={
                    "proposed_sentence": "I want to make an appointment with my doctor tomorrow.",
                    "confirmation_question": "Is this what you mean?",
                },
            )
        )
        yield


@pytest.fixture
def mock_transcribe_success():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/transcribe").mock(
            return_value=httpx.Response(
                200,
                json={"transcript": "I want to sleep."},
            )
        )
        yield


@pytest.fixture
def mock_backend_500_rewrite():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/rewrite").mock(
            return_value=httpx.Response(
                500,
                json={"detail": "Internal server error"},
            )
        )
        yield


@pytest.fixture
def mock_backend_500_clarify():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/clarify").mock(
            return_value=httpx.Response(
                500,
                json={"detail": "Internal server error"},
            )
        )
        yield


@pytest.fixture
def mock_backend_400_transcribe():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/transcribe").mock(
            return_value=httpx.Response(
                400,
                json={"detail": "Audio file is empty"},
            )
        )
        yield


@pytest.fixture
def mock_rewrite_timeout():
    with respx.mock:
        respx.post(f"{TEST_API_URL}/rewrite").mock(
            side_effect=httpx.TimeoutException("timed out")
        )
        yield
