"""Rate limit tests — no OpenAI calls."""
import io
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import rate_limit

client = TestClient(app)

TEST_IP = "10.0.0.1"
OTHER_IP = "10.0.0.2"


def _rewrite(ip: str = TEST_IP, headers: dict | None = None):
    """Send one /rewrite request from the given IP with a mocked logic layer."""
    h = {"X-Forwarded-For": ip}
    if headers:
        h.update(headers)
    return client.post(
        "/rewrite",
        json={"message": "test", "language_hint": "en"},
        headers=h,
    )


def _clarify(ip: str = TEST_IP):
    return client.post(
        "/clarify",
        json={"original_message": "test", "clarification": "more", "language_hint": "en"},
        headers={"X-Forwarded-For": ip},
    )


def _transcribe(ip: str = TEST_IP):
    return client.post(
        "/transcribe",
        files={"audio": ("recording.webm", io.BytesIO(b"fake"), "audio/webm")},
        data={"language_hint": "en"},
        headers={"X-Forwarded-For": ip},
    )


@pytest.fixture(autouse=True)
def reset_rate_limit_state():
    """Clear the in-memory request log before every test."""
    rate_limit._requests.clear()
    yield
    rate_limit._requests.clear()


def test_normal_user_blocked_after_50_requests(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )

    # First 50 requests must succeed
    for i in range(rate_limit.DAILY_LIMIT):
        r = _rewrite()
        assert r.status_code == 200, f"Request {i + 1} should succeed but got {r.status_code}"

    # 51st request must be blocked
    r = _rewrite()
    assert r.status_code == 429
    assert "Daily limit" in r.json()["detail"]


def test_admin_user_never_blocked(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )
    monkeypatch.setenv("ADMIN_TOKEN", "secret-admin-token")

    # Admin can send far more than the daily limit
    for i in range(rate_limit.DAILY_LIMIT + 10):
        r = _rewrite(headers={"X-Admin-Token": "secret-admin-token"})
        assert r.status_code == 200, f"Admin request {i + 1} should succeed but got {r.status_code}"


def test_team_access_user_never_blocked(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )
    monkeypatch.setenv("TEAM_ACCESS_TOKEN", "team-secret-token")

    for i in range(rate_limit.DAILY_LIMIT + 10):
        r = _rewrite(headers={"X-Admin-Token": "team-secret-token"})
        assert r.status_code == 200, f"Team request {i + 1} should succeed but got {r.status_code}"


def test_rate_limit_resets_after_24_hours(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )

    # Fill up the limit
    for _ in range(rate_limit.DAILY_LIMIT):
        _rewrite()

    # Confirm blocked
    assert _rewrite().status_code == 429

    # Simulate 24 hours passing by backdating all stored timestamps
    old_time = time.time() - rate_limit.WINDOW_SECONDS - 1
    rate_limit._requests[TEST_IP] = [old_time] * rate_limit.DAILY_LIMIT

    # Should be allowed again
    r = _rewrite()
    assert r.status_code == 200


def test_two_users_do_not_share_limit(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )

    # Fill up the limit for TEST_IP
    for _ in range(rate_limit.DAILY_LIMIT):
        _rewrite(ip=TEST_IP)

    # TEST_IP is blocked
    assert _rewrite(ip=TEST_IP).status_code == 429

    # OTHER_IP must still be allowed
    r = _rewrite(ip=OTHER_IP)
    assert r.status_code == 200


def test_wrong_admin_token_is_rate_limited(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )
    monkeypatch.setenv("ADMIN_TOKEN", "correct-token")

    # Fill up the limit
    for _ in range(rate_limit.DAILY_LIMIT):
        _rewrite()

    # Wrong token must NOT bypass the limit
    r = _rewrite(headers={"X-Admin-Token": "wrong-token"})
    assert r.status_code == 429


def test_wrong_team_token_is_rate_limited(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_and_question",
        lambda msg, lang: ("Sentence.", "Question?"),
    )
    monkeypatch.setenv("TEAM_ACCESS_TOKEN", "correct-team-token")

    for _ in range(rate_limit.DAILY_LIMIT):
        _rewrite()

    r = _rewrite(headers={"X-Admin-Token": "wrong-token"})
    assert r.status_code == 429


def test_rate_limit_applies_to_clarify_and_transcribe(monkeypatch):
    monkeypatch.setattr(
        "app.main.logic.propose_rewrite_after_clarification",
        lambda orig, clarif, lang: ("Sentence.", "Question?"),
    )
    monkeypatch.setattr(
        "app.main.logic.transcribe_audio",
        lambda audio_bytes, filename, language_hint: "Hello",
    )

    # Use up all requests on /clarify and /transcribe (alternating)
    for i in range(rate_limit.DAILY_LIMIT):
        if i % 2 == 0:
            _clarify()
        else:
            _transcribe()

    # Both endpoints must now be blocked
    assert _clarify().status_code == 429
    assert _transcribe().status_code == 429
