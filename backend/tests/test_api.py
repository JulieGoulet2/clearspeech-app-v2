"""HTTP API tests with mocked logic — no OpenAI calls."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_post_rewrite_returns_200_and_json_shape(monkeypatch):
    def fake_propose_rewrite_and_question(message: str, language_hint: str):
        assert message == "Hello"
        assert language_hint == "en"
        return ("Mock proposed sentence.", "Mock confirmation?")

    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        fake_propose_rewrite_and_question,
    )

    response = client.post(
        "/rewrite",
        json={"message": "Hello", "language_hint": "en"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["proposed_sentence"] == "Mock proposed sentence."
    assert data["confirmation_question"] == "Mock confirmation?"


def test_post_clarify_returns_200_and_json_shape(monkeypatch):
    def fake_propose_after_clarification(
        original_message: str, clarification: str, language_hint: str
    ):
        assert original_message == "Original"
        assert clarification == "More context"
        assert language_hint == "fr"
        return ("Mock clarified rewrite.", "Mock confirm FR?")

    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_after_clarification",
        fake_propose_after_clarification,
    )

    response = client.post(
        "/clarify",
        json={
            "original_message": "Original",
            "clarification": "More context",
            "language_hint": "fr",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["proposed_sentence"] == "Mock clarified rewrite."
    assert data["confirmation_question"] == "Mock confirm FR?"
