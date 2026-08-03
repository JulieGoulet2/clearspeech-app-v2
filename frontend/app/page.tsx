/**
 * page.tsx — Main page of the ClearSpeech application.
 *
 * This is a single-page React component that guides the user through
 * a short conversation:
 *   1. Compose — user writes (or dictates) a short message
 *   2. Confirm — app proposes a clearer version and asks "Is this what you mean?"
 *   3. Clarify — if the user says No, they can add one short clarification
 *   4. Final   — the final sentence is shown and can be copied
 *
 * Voice input uses the browser's MediaRecorder API. The audio is sent to
 * the backend /transcribe endpoint (OpenAI Whisper) and the transcript is
 * inserted into the text field.
 *
 * All user-facing text is in uiStrings.ts so the interface works in
 * English, French, German, and Spanish.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import packageJson from "../package.json";
import { isLang, t, type Lang } from "../lib/uiStrings";
import { convertToWav } from "../lib/audioUtils";

type RewriteResponse = {
  proposed_sentence: string;
  confirmation_question: string;
};

type Phase = "compose" | "confirm" | "clarify" | "final";

type LoadingKind = "rewrite" | "clarify" | null;
type BrowserKind = "safari" | "chromium" | "other" | "unknown";

// Web Speech API — not yet in TypeScript's standard lib
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition;
    webkitSpeechRecognition?: new () => ISpeechRecognition;
  }
}

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
const TEAM_ACCESS_STORAGE_KEY = "clearspeech-team-access-code";

/** Base URL for the backend API (no trailing slash). Null if NEXT_PUBLIC_API_URL is unset. */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function apiHeaders(teamAccessCode?: string): HeadersInit {
  return teamAccessCode ? { "X-Admin-Token": teamAccessCode } : {};
}
if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL environment variable");
}
const MISSING_API_URL_MESSAGE =
  "Configuration error: NEXT_PUBLIC_API_URL is not set. Add it to your environment (for example in .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000) and rebuild the frontend.";
const SERVER_WAKE_UP_MESSAGE =
  "The server may be waking up after inactivity. Please wait about a minute and try again.";
const MIN_RECORDING_DURATION_MS = 900;
const MIN_AUDIO_BLOB_BYTES = 120;
const RECORDER_TIMESLICE_MS = 250;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function parseApiError(
  response: Response,
  adminTokenSet: boolean,
  errorAdminToken: string,
  fallback: string
): Promise<string> {
  let detail = fallback;
  try {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      detail = typeof parsed.detail === "string" ? parsed.detail : text || fallback;
    } catch {
      detail = text || fallback;
    }
  } catch {
    // keep fallback
  }
  if (response.status === 429 && adminTokenSet) {
    return errorAdminToken;
  }
  return detail;
}

function getUserFriendlyRequestError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;

  const message = err.message.trim();
  const normalized = message.toLowerCase();
  const isLikelyWakeUpOrNetworkIssue =
    normalized === "failed to fetch" ||
    normalized === "load failed" ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed");

  if (isLikelyWakeUpOrNetworkIssue) return SERVER_WAKE_UP_MESSAGE;
  // Show the raw message if it looks like a 4xx/5xx detail from the backend
  return message || fallback;
}

// ---------------------------------------------------------------------------
// Text-to-speech helper
// ---------------------------------------------------------------------------

function speak(text: string, language: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!text.trim()) return;

  const synthesis = window.speechSynthesis;
  const primaryLangCode =
    language === "fr"
      ? "fr-FR"
      : language === "de"
        ? "de-DE"
        : language === "es"
          ? "es-ES"
          : "en-US";
  const preferredLangCodes =
    language === "fr"
      ? ["fr-FR", "fr-CA", "fr"]
      : language === "de"
        ? ["de-DE", "de-AT", "de-CH", "de"]
        : language === "es"
          ? ["es-ES", "es-MX", "es-419", "es-US", "es"]
        : ["en-US", "en-GB", "en"];

  const speakWithVoices = (voices: SpeechSynthesisVoice[]) => {
    synthesis.cancel();
    synthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = primaryLangCode;

    const normalizedVoices = voices.map((voice) => ({
      voice,
      lang: voice.lang.toLowerCase(),
    }));
    const matchedVoice = preferredLangCodes
      .map((code) => code.toLowerCase())
      .map(
        (code) =>
          normalizedVoices.find((entry) => entry.lang === code)?.voice ??
          normalizedVoices.find((entry) => entry.lang.startsWith(`${code}-`))?.voice,
      )
      .find((voice): voice is SpeechSynthesisVoice => Boolean(voice));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }

    synthesis.speak(utterance);
  };

  const voices = synthesis.getVoices();
  if (voices.length > 0) {
    speakWithVoices(voices);
    return;
  }

  const onVoicesChanged = () => {
    synthesis.removeEventListener?.("voiceschanged", onVoicesChanged);
    speakWithVoices(synthesis.getVoices());
  };
  synthesis.addEventListener?.("voiceschanged", onVoicesChanged);

  // Fallback: if voiceschanged never fires, still attempt speech shortly after.
  window.setTimeout(() => {
    synthesis.removeEventListener?.("voiceschanged", onVoicesChanged);
    speakWithVoices(synthesis.getVoices());
  }, 250);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
  const [notice, setNotice] = useState("");
  const [teamAccessDraft, setTeamAccessDraft] = useState("");
  const [teamAccessCode, setTeamAccessCode] = useState("");
  const [isSavingTeamAccess, setIsSavingTeamAccess] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [browserKind, setBrowserKind] = useState<BrowserKind>("unknown");
  const [recordingTarget, setRecordingTarget] = useState<"message" | "clarification">("message");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordingStartMsRef = useRef<number>(0);
  const tr = t(language);
  const isDictationPreferredBrowser = browserKind === "safari" || browserKind === "chromium";
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedCode = window.localStorage.getItem(TEAM_ACCESS_STORAGE_KEY) ?? "";
    setTeamAccessDraft(storedCode);
    if (!storedCode.trim()) return;

    void validateAndStoreTeamAccessCode(storedCode, { fromStorage: true });
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    const isSafari =
      (ua.includes("safari") || ua.includes("mobile/")) &&
      !ua.includes("chrome") &&
      !ua.includes("crios") &&
      !ua.includes("chromium") &&
      !ua.includes("edg") &&
      !ua.includes("opr");
    const isChromiumFamily =
      ua.includes("chrome") ||
      ua.includes("crios") ||
      ua.includes("chromium") ||
      ua.includes("edg") ||
      ua.includes("opr");
    if (isSafari) {
      setBrowserKind("safari");
      return;
    }
    if (isChromiumFamily) {
      setBrowserKind("chromium");
      return;
    }
    setBrowserKind("other");
  }, []);

  function recordingMimeType(): string {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
    const preferredMimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
    ];
    for (const type of preferredMimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  }

  function languageToLocale(language: Lang): string {
    return language === "fr"
      ? "fr"
      : language === "de"
        ? "de"
        : language === "es"
          ? "es"
          : "en";
  }

  async function validateAndStoreTeamAccessCode(
    rawCode: string,
    options: { fromStorage?: boolean } = {},
  ) {
    const normalized = rawCode.trim();
    setError("");
    setNotice("");

    if (!normalized) {
      if (!options.fromStorage) {
        setError(tr.teamAccessEmpty);
      }
      return;
    }

    setIsSavingTeamAccess(true);
    try {
      const response = await fetch(`${API_BASE_URL}/validate-team-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: normalized,
          language_hint: "en",
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 401 ? tr.teamAccessInvalid : tr.errorRequest);
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(TEAM_ACCESS_STORAGE_KEY, normalized);
      }
      setTeamAccessCode(normalized);
      setTeamAccessDraft(normalized);
      setNotice(options.fromStorage ? "" : tr.teamAccessSaved);
    } catch (err) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(TEAM_ACCESS_STORAGE_KEY);
      }
      setTeamAccessCode("");
      setTeamAccessDraft(options.fromStorage ? "" : normalized);
      if (!options.fromStorage) {
        setError(getUserFriendlyRequestError(err, tr.errorUnknown));
      }
    } finally {
      setIsSavingTeamAccess(false);
    }
  }

  async function saveTeamAccessCode() {
    await validateAndStoreTeamAccessCode(teamAccessDraft);
  }

  function clearTeamAccessCode() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TEAM_ACCESS_STORAGE_KEY);
    }
    setTeamAccessCode("");
    setTeamAccessDraft("");
    setNotice("");
  }

  async function handleStartRecording(target: "message" | "clarification" = "message") {
    setError("");
    setNotice("");
    setRecordingTarget(target);

    // --- All browsers: MediaRecorder → WAV → OpenAI Whisper transcription ---
    // Chrome records WebM/Opus which is converted to WAV via convertToWav before upload.
    // Safari records audio/mp4 which is sent as-is (OpenAI handles it reliably).
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }
    try {
      const activeTarget = target;
      // Try to skip virtual audio devices (Teams, Zoom, etc.) that Chrome may
      // select as the system default. Only filter when labels are available
      // (i.e. permission was already granted); otherwise fall back to default.
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === "audioinput");
      const hasLabels = audioInputs.some((d) => d.label);
      const VIRTUAL_KEYWORDS = ["virtual", "teams", "zoom", "aggregate", "blackhole", "soundflower", "loopback"];
      const realMic = hasLabels
        ? audioInputs.find((d) => !VIRTUAL_KEYWORDS.some((kw) => d.label.toLowerCase().includes(kw)))
        : null;
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true,
        ...(realMic ? { deviceId: { exact: realMic.deviceId } } : {}),
      };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      console.info("[STT] Selected mic:", realMic?.label ?? "browser default");

      const mimeType = recordingMimeType();
      const recorderOptions: MediaRecorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 64000 }
        : { audioBitsPerSecond: 64000 };
      const recorder = new MediaRecorder(stream, recorderOptions);
      console.info("[STT] Recording start:", {
        target: activeTarget,
        mimeType: mimeType || "browser_default",
      });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recordingStartMsRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.info("[STT] Chunk captured:", {
            chunkBytes: event.data.size,
            chunkCount: chunksRef.current.length,
          });
        }
      };
      recorder.onstop = () => {
        // Defer blob assembly by one microtask tick so Safari's final
        // ondataavailable event fires before we read chunksRef.current.
        setTimeout(async () => {
        console.info("[STT] Recording stop:", { target: activeTarget });
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const elapsedMs = Date.now() - recordingStartMsRef.current;
        const chunkCount = chunksRef.current.length;
        chunksRef.current = [];
        console.info("[STT] Blob ready:", {
          sizeBytes: blob.size,
          elapsedMs,
          chunkCount,
          mimeType: blob.type || mimeType || "audio/webm",
        });
        if (blob.size === 0) {
          setError("No audio was recorded. Please try again. (reason: empty recording)");
          return;
        }
        if (elapsedMs < MIN_RECORDING_DURATION_MS) {
          setError(
            `No audio was recorded. Please try again. (reason: duration too short ${elapsedMs}ms < ${MIN_RECORDING_DURATION_MS}ms)`,
          );
          setNotice("");
          return;
        }
        if (blob.size < MIN_AUDIO_BLOB_BYTES) {
          setError(
            `No audio was recorded. Please try again. (reason: blob too small ${blob.size} bytes < ${MIN_AUDIO_BLOB_BYTES} bytes)`,
          );
          setNotice("");
          return;
        }

        setIsTranscribing(true);
        try {
          // Chrome: send raw WebM/Opus chunks concatenated — whisper-1 handles it natively.
          //         AudioContext WAV conversion loses the beginning of chunked WebM.
          // Safari: convert to WAV — AudioContext handles Safari's MP4 chunks correctly.
          let file: File;
          if (browserKind === "safari") {
            file = await convertToWav(blob);
          } else {
            file = new File([blob], "recording.webm", { type: blob.type || "audio/webm;codecs=opus" });
            console.info("[STT] Chrome: sending raw webm, size:", blob.size);
          }
          const formData = new FormData();
          formData.append("audio", file);
          formData.append("language_hint", languageToLocale(language));
          console.info("[STT] Upload start:", {
            sizeBytes: blob.size,
            mimeType: file.type,
            target: activeTarget,
          });
          const response = await fetch(`${API_BASE_URL}/transcribe`, {
            method: "POST",
            headers: apiHeaders(teamAccessCode),
            body: formData,
          });
          if (!response.ok) {
            const msg = await parseApiError(response, !!teamAccessCode, tr.errorAdminToken, tr.errorRequest);
            throw new Error(msg);
          }
          const data: { transcript?: string; text?: string } = await response.json();
          console.info("[STT] Returned JSON:", data);
          const transcript = (data.transcript ?? data.text ?? "").trim();
          console.info("[STT] Extracted transcript:", transcript);
          if (!transcript) {
            setError("Speech was recorded, but no usable transcript was produced. (reason: empty transcript)");
            setNotice("");
            return;
          }
          if (activeTarget === "clarification") {
            setClarification((prev) => {
              const base = prev.trim();
              const next = base ? `${prev.replace(/\s+$/, "")} ${transcript}` : transcript;
              console.info("[STT] Clarification textarea state updated");
              return next;
            });
          } else {
            setMessage((prev) => {
              const base = prev.trim();
              const next = base ? `${prev.replace(/\s+$/, "")} ${transcript}` : transcript;
              console.info("[STT] Message textarea state updated");
              return next;
            });
          }
          setNotice("Transcript inserted. Please check and edit it.");
        } catch (err) {
          setError(getUserFriendlyRequestError(err, tr.errorUnknown));
          setNotice("");
        } finally {
          setIsTranscribing(false);
        }
        }, 0); // end setTimeout
      };

      // All browsers need timeslice — without it Chrome only delivers ~600 bytes
      // (WebM header only, no audio data) on stop().
      recorder.start(RECORDER_TIMESLICE_MS);
      setIsRecording(true);
    } catch {
      setError("Microphone access failed. Please allow microphone access and try again.");
      setIsRecording(false);
    }
  }

  function handleStopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.stop();
  }

  async function handleRewrite() {
    setError("");
    setNotice("");
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
          ...apiHeaders(teamAccessCode),
        },
        body: JSON.stringify({
          message,
          language_hint: language,
        }),
      });

      if (!response.ok) {
        const msg = await parseApiError(response, !!teamAccessCode, tr.errorAdminToken, tr.errorRequest);
        throw new Error(msg);
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
    setNotice("");

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
          ...apiHeaders(teamAccessCode),
        },
        body: JSON.stringify({
          original_message: message,
          clarification,
          language_hint: language,
        }),
      });

      if (!response.ok) {
        const msg = await parseApiError(response, !!teamAccessCode, tr.errorAdminToken, tr.errorRequest);
        throw new Error(msg);
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
    setNotice("");
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

        <div
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 shadow-sm dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="note"
        >
          <p>{tr.testingNote}</p>
        </div>

        <section className={cardClass} aria-label={tr.teamAccessTitle}>
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {tr.teamAccessTitle}
              </h2>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {tr.teamAccessBody}
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                htmlFor="team-access-code"
              >
                {tr.teamAccessLabel}
              </label>
              <input
                id="team-access-code"
                type="password"
                value={teamAccessDraft}
                onChange={(e) => setTeamAccessDraft(e.target.value)}
                placeholder={tr.teamAccessPlaceholder}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-600 dark:bg-neutral-900"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={saveTeamAccessCode}
                disabled={isSavingTeamAccess}
              >
                {isSavingTeamAccess ? tr.teamAccessValidating : tr.teamAccessSave}
              </button>
              <button type="button" className={btnSecondary} onClick={clearTeamAccessCode}>
                {tr.teamAccessClear}
              </button>
            </div>

            {teamAccessCode && (
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {tr.teamAccessActive}
              </p>
            )}
          </div>
        </section>

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
            <option value="es">Español</option>
          </select>
        </section>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
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
          </div>

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
                  <h3 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {tr.helpVoiceTitle}
                  </h3>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>{tr.helpVoiceReadAloud}</li>
                    <li>{tr.helpVoiceDictation}</li>
                  </ul>
                  <p className="mt-2 font-semibold text-rose-700 dark:text-rose-400">
                    {tr.voiceInputSafariOnlyNote}
                  </p>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={btnSpeak}
                  onClick={() =>
                    isRecording && recordingTarget === "message"
                      ? handleStopRecording()
                      : handleStartRecording("message")
                  }
                  disabled={isTranscribing}
                >
                  {isRecording && recordingTarget === "message"
                    ? tr.voiceInputBetaStopLabel
                    : tr.voiceInputBetaLabel}
                </button>
                {isTranscribing && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400" role="status">
                    Transcribing audio...
                  </p>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {tr.voiceInputBetaNote}
              </p>
              {!isDictationPreferredBrowser && browserKind !== "unknown" && (
                <p className="text-sm text-amber-700 dark:text-amber-400" role="status">
                  {tr.voiceInputSafariWarning}
                </p>
              )}
              <textarea
                id="user-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={tr.placeholder}
                rows={6}
                className="w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={btnPrimary}
                onClick={handleRewrite}
                disabled={loading || !API_BASE_URL}
              >
                {tr.getClearer}
              </button>
            </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  id="original-message-label"
                  className="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                >
                  {tr.yourMessage}
                </h3>
                <button
                  type="button"
                  className={btnSpeak}
                  onClick={() => speak(message, language)}
                  disabled={!message.trim()}
                >
                  {tr.readAloud}
                </button>
              </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={btnSpeak}
                  onClick={() =>
                    isRecording && recordingTarget === "clarification"
                      ? handleStopRecording()
                      : handleStartRecording("clarification")
                  }
                  disabled={isTranscribing}
                >
                  {isRecording && recordingTarget === "clarification"
                    ? tr.voiceInputBetaStopLabel
                    : tr.voiceInputBetaLabel}
                </button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {tr.voiceInputBetaNote}
              </p>
              {!isDictationPreferredBrowser && browserKind !== "unknown" && (
                <p className="text-sm text-amber-700 dark:text-amber-400" role="status">
                  {tr.voiceInputSafariWarning}
                </p>
              )}
              <textarea
                id="clarify-text"
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                placeholder={tr.clarifyPlaceholder}
                rows={5}
                className="w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base leading-relaxed shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:border-neutral-600 dark:bg-neutral-900 dark:placeholder:text-neutral-500"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="final-heading"
                className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
              >
                {tr.finalText}
              </h2>
              <button
                type="button"
                className={btnSpeak}
                onClick={() => speak(finalText, language)}
                disabled={!finalText.trim()}
              >
                {tr.readAloud}
              </button>
            </div>
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
        {notice && (
          <div
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
            role="status"
            aria-live="polite"
          >
            {notice}
          </div>
        )}
      </div>
    </main>
  );
}
