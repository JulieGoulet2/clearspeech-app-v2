"""HTTP API tests with mocked logic — no OpenAI calls."""
import io

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


def test_post_transcribe_returns_transcript(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.transcribe_audio",
        lambda audio_bytes, filename, language_hint: "Are you working?",
    )

    response = client.post(
        "/transcribe",
        files={"audio": ("recording.webm", io.BytesIO(b"fake-audio-data"), "audio/webm")},
        data={"language_hint": "en"},
    )
    assert response.status_code == 200
    assert response.json()["transcript"] == "Are you working?"


def test_post_transcribe_empty_audio_returns_400(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.transcribe_audio",
        lambda audio_bytes, filename, language_hint: "",
    )

    response = client.post(
        "/transcribe",
        files={"audio": ("recording.webm", io.BytesIO(b"fake-audio-data"), "audio/webm")},
        data={"language_hint": "en"},
    )
    assert response.status_code == 400
    assert "no transcript" in response.json()["detail"].lower()


def test_post_transcribe_logic_error_returns_500(monkeypatch):
    def raise_error(audio_bytes, filename, language_hint):
        raise RuntimeError("OpenAI API failure")

    monkeypatch.setattr("app.main.logic.transcribe_audio", raise_error)

    response = client.post(
        "/transcribe",
        files={"audio": ("recording.webm", io.BytesIO(b"fake-audio-data"), "audio/webm")},
        data={"language_hint": "en"},
    )
    assert response.status_code == 500
    assert "OpenAI API failure" in response.json()["detail"]
