"""Logic that normally calls the model — `_call_model` is monkeypatched, no real API."""
import pytest

from app import logic


def test_propose_rewrite_and_question_two_lines(monkeypatch):
    def fake_call_model(_user_input: str) -> str:
        return "Proposed line one.\nConfirmation line two?"

    monkeypatch.setattr(logic, "_call_model", fake_call_model)
    proposed, confirmation = logic.propose_rewrite_and_question("user text", "en")
    assert proposed == "Proposed line one."
    assert confirmation == "Confirmation line two?"


def test_propose_rewrite_after_clarification_two_lines(monkeypatch):
    def fake_call_model(_user_input: str) -> str:
        return "Rewritten sentence.\nIs this OK?"

    monkeypatch.setattr(logic, "_call_model", fake_call_model)
    proposed, confirmation = logic.propose_rewrite_after_clarification(
        "original", "clarification detail", "de"
    )
    assert proposed == "Rewritten sentence."
    assert confirmation == "Is this OK?"


@pytest.mark.parametrize("lang", ["en", "fr", "de"])
def test_propose_rewrite_and_question_one_line_uses_confirmation_fallback(
    monkeypatch, lang
):
    def fake_call_model(_user_input: str) -> str:
        return "Only one line from model."

    monkeypatch.setattr(logic, "_call_model", fake_call_model)
    proposed, confirmation = logic.propose_rewrite_and_question("anything", lang)
    assert proposed == "Only one line from model."
    assert confirmation == logic.confirmation_question_for_user(lang)


@pytest.mark.parametrize("lang", ["en", "fr", "de"])
def test_propose_rewrite_after_clarification_one_line_uses_confirmation_fallback(
    monkeypatch, lang
):
    def fake_call_model(_user_input: str) -> str:
        return "Solo line."

    monkeypatch.setattr(logic, "_call_model", fake_call_model)
    proposed, confirmation = logic.propose_rewrite_after_clarification(
        "orig", "clar", lang
    )
    assert proposed == "Solo line."
    assert confirmation == logic.confirmation_question_for_user(lang)
