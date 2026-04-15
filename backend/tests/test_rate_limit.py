"""Rate limit tests — no OpenAI calls."""
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import rate_limit

client = TestClient(app)

TEST_IP = "10.0.0.1"


def _rewrite(headers: dict | None = None):
    """Send one /rewrite request from TEST_IP with a mocked logic layer."""
    h = {"X-Forwarded-For": TEST_IP}
    if headers:
        h.update(headers)
    return client.post(
        "/rewrite",
        json={"message": "test", "language_hint": "en"},
        headers=h,
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
