"use client";

import { useEffect, useState } from "react";
import packageJson from "../package.json";
import { isLang, t, type Lang } from "../lib/uiStrings";

type RewriteResponse = {
  proposed_sentence: string;
  confirmation_question: string;
};

type Phase = "compose" | "confirm" | "clarify" | "final";

type LoadingKind = "rewrite" | "clarify" | null;

const cardClass =
  "rounded-2xl border border-neutral-200/90 bg-white p-5 text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 md:p-6";

const btnBase =
  "inline-flex min-h-[3rem] min-w-[8rem] items-center justify-center rounded-xl px-6 py-3 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-neutral-900";

const btnPrimary =
  `${btnBase} bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-500 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white`;

const btnSecondary =
  `${btnBase} border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800`;

const btnYes =
  `${btnBase} bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-emerald-600`;

const btnNo =
  `${btnBase} bg-rose-700 text-white hover:bg-rose-800 focus-visible:ring-rose-600`;

const btnCopy =
  `${btnBase} bg-emerald-800 text-white hover:bg-emerald-900 focus-visible:ring-emerald-600`;
const btnSpeak =
  `${btnBase} min-h-0 min-w-0 px-4 py-2 text-sm border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800`;

/** Base URL for the backend API (no trailing slash). Null if NEXT_PUBLIC_API_URL is unset. */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}
const MISSING_API_URL_MESSAGE =
  "Configuration error: NEXT_PUBLIC_API_URL is not set. Add it to your environment (for example in .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000) and rebuild the frontend.";
const SERVER_WAKE_UP_MESSAGE =
  "The server may be waking up after inactivity. Please wait about a minute and try again.";

function getUserFriendlyRequestError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;

  const message = err.message.trim();
  const normalized = message.toLowerCase();
  const isLikelyWakeUpOrNetworkIssue =
    normalized === "failed to fetch" ||
    normalized === "load failed" ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed");

  return isLikelyWakeUpOrNetworkIssue ? SERVER_WAKE_UP_MESSAGE : message || fallback;
}

function speak(text: string, language: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!text.trim()) return;

  const langCode =
    language === "fr" ? "fr-FR" : language === "de" ? "de-DE" : "en-US";

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;

  const voices = window.speechSynthesis.getVoices();
  const targetLang = langCode.toLowerCase();
  const targetPrefix = targetLang.split("-")[0];
  const matchedVoice =
    voices.find((voice) => voice.lang.toLowerCase() === targetLang) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${targetPrefix}-`)) ??
    voices.find((voice) => voice.lang.toLowerCase() === targetPrefix);

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [language, setLanguage] = useState<Lang>("en");
  const [message, setMessage] = useState("");
  const [clarification, setClarification] = useState("");
  const [result, setResult] = useState<RewriteResponse | null>(null);
  const [finalText, setFinalText] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [loading, setLoading] = useState(false);
  const [loadingKind, setLoadingKind] = useState<LoadingKind>(null);
  const [error, setError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const tr = t(language);
  const helpTextToRead = [
    tr.helpTitle,
    tr.helpWhatTitle,
    tr.helpWhatBody,
    tr.helpHowTitle,
    tr.helpStep1,
    tr.helpStep2,
    tr.helpStep3,
    tr.helpStep4,
    tr.helpStep5,
    tr.helpTipsTitle,
    tr.helpIncomplete,
    tr.helpCopyNote,
  ].join(" ");

  useEffect(() => {
    document.title = tr.title;
  }, [tr.title]);

  async function handleRewrite() {
    setError("");
    setResult(null);

    if (!API_BASE_URL) {
      setError(MISSING_API_URL_MESSAGE);
      return;
    }

    if (!message.trim()) {
      setError(tr.errorEmptyMessage);
      return;
    }

    setLoadingKind("rewrite");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/rewrite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          language_hint: language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || tr.errorRequest);
      }

      const data: RewriteResponse = await response.json();
      setResult(data);
      setPhase("confirm");
    } catch (err) {
      setError(getUserFriendlyRequestError(err, tr.errorUnknown));
    } finally {
      setLoading(false);
      setLoadingKind(null);
    }
  }

  async function handleClarify() {
    setError("");

    if (!API_BASE_URL) {
      setError(MISSING_API_URL_MESSAGE);
      return;
    }

    if (!clarification.trim()) {
      setError(tr.errorEmptyClarification);
      return;
    }

    setLoadingKind("clarify");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/clarify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_message: message,
          clarification,
          language_hint: language,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || tr.errorRequest);
      }

      const data: RewriteResponse = await response.json();
      setResult(data);
      setClarification("");
      setPhase("confirm");
    } catch (err) {
      setError(getUserFriendlyRequestError(err, tr.errorUnknown));
    } finally {
      setLoading(false);
      setLoadingKind(null);
    }
  }

  function handleYes() {
    if (result) {
      setFinalText(result.proposed_sentence);
      setPhase("final");
    }
  }

  function handleNo() {
    setClarification("");
    setPhase("clarify");
  }

  function handleStartOver() {
    setMessage("");
    setClarification("");
    setResult(null);
    setFinalText("");
    setError("");
    setPhase("compose");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(finalText);
    } catch {
      setError(tr.errorCopy);
    }
  }

  const loadingMessage =
    loadingKind === "rewrite"
      ? tr.loadingImprove
      : loadingKind === "clarify"
        ? tr.loadingUpdate
        : "";

  return (
    <main className="relative min-h-screen bg-neutral-50 px-4 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 sm:px-6 md:px-8">
      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex max-w-sm flex-col items-center gap-5 rounded-2xl border border-neutral-200 bg-white px-10 py-8 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800 dark:border-neutral-600 dark:border-t-neutral-200"
              aria-hidden
            />
            <p className="text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {tr.title}
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            {tr.subtitle}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Version {packageJson.version}
          </p>
        </header>

        {!API_BASE_URL && (
          <div
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-relaxed text-rose-950 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
            role="alert"
          >
            <p className="font-semibold">{MISSING_API_URL_MESSAGE}</p>
          </div>
        )}

        <section className="space-y-3" aria-label={tr.languageLabel}>
          <label
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
            htmlFor="lang-select"
          >
            {tr.languageLabel}
          </label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => {
              const v = e.target.value;
              setLanguage(isLang(v) ? v : "en");
            }}
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-600 dark:bg-neutral-900"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </section>

        <div className="space-y-3">
          <button
            type="button"
            id="help-toggle"
            className={`${btnSecondary} w-full sm:w-auto`}
            onClick={() => setHelpOpen((open) => !open)}
            aria-expanded={helpOpen}
            aria-controls="help-panel"
          >
            {helpOpen ? tr.helpHide : tr.helpShow}
          </button>

          {helpOpen && (
            <div
              id="help-panel"
              role="region"
              aria-labelledby="help-panel-title"
              className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-950 md:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2
                  id="help-panel-title"
                  className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  {tr.helpTitle}
                </h2>
                <button
                  type="button"
                  className={btnSpeak}
                  onClick={() => speak(helpTextToRead, language)}
                  disabled={!helpTextToRead.trim()}
                >
                  {tr.readAloud}
                </button>
              </div>
              <div className="space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                <section>
                  <h3 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {tr.helpWhatTitle}
                  </h3>
                  <p>{tr.helpWhatBody}</p>
                </section>
                <section>
                  <h3 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {tr.helpHowTitle}
                  </h3>
                  <ol className="list-decimal space-y-2 pl-5">
                    <li>{tr.helpStep1}</li>
                    <li>{tr.helpStep2}</li>
                    <li>{tr.helpStep3}</li>
                    <li>{tr.helpStep4}</li>
                    <li>{tr.helpStep5}</li>
                  </ol>
                </section>
                <section>
                  <h3 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {tr.helpTipsTitle}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>{tr.helpIncomplete}</li>
                    <li>{tr.helpCopyNote}</li>
                  </ul>
                </section>
                <section>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {tr.helpContact}
                  </p>
                  <p>
                    <a
                      className="text-emerald-800 underline underline-offset-2 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                      href="mailto:drjuliegoulet@gmail.com"
                    >
                      drjuliegoulet@gmail.com
                    </a>
                  </p>
                </section>
                <p className="border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-500">
                  {tr.helpModel}
                </p>
              </div>
            </div>
          )}
        </div>

        {phase === "compose" && (
          <section className="space-y-6" aria-label={tr.yourMessage}>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                htmlFor="user-message"
              >
                {tr.yourMessage}
              </label>
              <textarea
                id="user-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={tr.placeholder}
                rows={6}
                className="w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
              />
            </div>

            <button
              type="button"
              className={btnPrimary}
              onClick={handleRewrite}
              disabled={loading || !API_BASE_URL}
            >
              {tr.getClearer}
            </button>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {tr.firstRequestNote}
            </p>
          </section>
        )}

        {phase === "confirm" && result && (
          <section className="space-y-10" aria-labelledby="confirm-heading">
            <h2
              id="confirm-heading"
              className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {tr.proposedVersion}
            </h2>

            <article className="space-y-3" aria-labelledby="original-message-label">
              <h3
                id="original-message-label"
                className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
              >
                {tr.yourMessage}
              </h3>
              <div
                className={`${cardClass} border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/60`}
              >
                <p className="whitespace-pre-wrap text-lg leading-relaxed">{message}</p>
              </div>
            </article>

            {result.proposed_sentence.startsWith("ERROR:") ? (
              <div
                className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100 md:p-6"
                role="alert"
              >
                <p className="font-medium">{tr.errorApi}</p>
                <p className="mt-2 text-sm opacity-90">
                  {result.proposed_sentence.slice(6).trim()}
                </p>
              </div>
            ) : (
              <article className="space-y-3" aria-labelledby="sentence-label">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    id="sentence-label"
                    className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                  >
                    {tr.suggestedSentence}
                  </h3>
                  <button
                    type="button"
                    className={btnSpeak}
                    onClick={() => speak(result.proposed_sentence, language)}
                    disabled={!result.proposed_sentence.trim()}
                  >
                    {tr.readAloud}
                  </button>
                </div>
                <div className={cardClass}>
                  <p className="text-lg leading-relaxed">{result.proposed_sentence}</p>
                </div>
              </article>
            )}

            <article className="space-y-3" aria-labelledby="question-label">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="question-label"
                  className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                >
                  {tr.questionLabel}
                </h3>
                <button
                  type="button"
                  className={btnSpeak}
                  onClick={() => speak(result.confirmation_question, language)}
                  disabled={!result.confirmation_question.trim()}
                >
                  {tr.readAloud}
                </button>
              </div>
              <div
                className={`${cardClass} border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/60`}
              >
                <p className="text-lg leading-relaxed">
                  {result.confirmation_question}
                </p>
              </div>
            </article>

            <div
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"
              role="group"
              aria-label={tr.proposedVersion}
            >
              <button
                type="button"
                className={btnYes}
                onClick={handleYes}
              >
                {tr.yes}
              </button>

              <button type="button" className={btnNo} onClick={handleNo}>
                {tr.no}
              </button>

              <button
                type="button"
                className={btnSecondary}
                onClick={handleStartOver}
              >
                {tr.startOver}
              </button>
            </div>
          </section>
        )}

        {phase === "clarify" && (
          <section className="space-y-6" aria-labelledby="clarify-heading">
            <h2
              id="clarify-heading"
              className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {tr.clarifyTitle}
            </h2>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                htmlFor="clarify-text"
              >
                {tr.yourAnswer}
              </label>
              <textarea
                id="clarify-text"
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                placeholder={tr.clarifyPlaceholder}
                rows={5}
                className="w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className={btnPrimary}
                onClick={handleClarify}
                disabled={loading || !API_BASE_URL}
              >
                {tr.updateSuggestion}
              </button>

              <button
                type="button"
                className={btnSecondary}
                onClick={handleStartOver}
              >
                {tr.startOver}
              </button>
            </div>
          </section>
        )}

        {phase === "final" && (
          <section className="space-y-6" aria-labelledby="final-heading">
            <h2
              id="final-heading"
              className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            >
              {tr.finalText}
            </h2>
            <div className={cardClass}>
              <p className="text-lg leading-relaxed">{finalText}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" className={btnCopy} onClick={handleCopy}>
                {tr.copy}
              </button>

              <button
                type="button"
                className={btnSecondary}
                onClick={handleStartOver}
              >
                {tr.newMessage}
              </button>
            </div>
          </section>
        )}

        {error && (
          <div
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
