"""Pure helper tests — no OpenAI calls."""
from app.logic import clarification_question_for_user, confirmation_question_for_user

# French strings in logic.py use U+2019 (right single quotation mark) for apostrophes.
_FR_CLAR = "Qu\u2019est-ce que tu veux dire exactement ?"
_FR_CONF = "Est-ce que c\u2019est ce que tu veux dire?"
_ES_CLAR = "\u00bfQu\u00e9 quieres decir exactamente?"
_ES_CONF = "\u00bfEs esto lo que quieres decir?"


def test_confirmation_question_for_user_en():
    assert confirmation_question_for_user("en") == "Is this what you mean?"


def test_confirmation_question_for_user_fr():
    assert confirmation_question_for_user("fr") == _FR_CONF


def test_confirmation_question_for_user_de():
    assert confirmation_question_for_user("de") == "Ist das, was du meinst?"


def test_confirmation_question_for_user_es():
    assert confirmation_question_for_user("es") == _ES_CONF


def test_clarification_question_for_user_en():
    assert clarification_question_for_user("en") == "What do you mean exactly?"


def test_clarification_question_for_user_fr():
    assert clarification_question_for_user("fr") == _FR_CLAR


def test_clarification_question_for_user_de():
    assert clarification_question_for_user("de") == "Was meinst du genau?"


def test_clarification_question_for_user_es():
    assert clarification_question_for_user("es") == _ES_CLAR
