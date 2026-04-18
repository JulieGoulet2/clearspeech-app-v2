/**
 * dictation.test.tsx — Voice input tests for the ClearSpeech main page.
 *
 * Tests the full voice dictation flow: microphone access, MediaRecorder,
 * sending audio to the /transcribe endpoint, and inserting the transcript
 * into the message or clarification field. All browser APIs and fetch
 * calls are mocked so no microphone or backend is needed to run these tests.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../app/page";

type MockTranscribePayload = { transcript?: string; text?: string };

class MockMediaRecorder {
  static isTypeSupported(type: string) {
    return type === "audio/webm;codecs=opus" || type === "audio/webm";
  }

  mimeType: string;
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType || "audio/webm";
  }

  start() {
    this.state = "recording";
  }

  requestData() {
    this.ondataavailable?.({
      data: new Blob(["mock-audio-chunk-".repeat(10)], { type: this.mimeType }),
    } as BlobEvent);
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["mock-audio-chunk-2-".repeat(10)], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.();
  }
}

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
}

function mockTranscribeFetch(payload: MockTranscribePayload, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload,
    text: async () => (ok ? JSON.stringify(payload) : "Transcription failed. Please try again."),
  } as Response);
}

describe("Dictation frontend behavior", () => {
  let nowMs = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    nowMs = 0;
    jest.spyOn(Date, "now").mockImplementation(() => nowMs);
    (global as unknown as { MediaRecorder: typeof MediaRecorder }).MediaRecorder =
      MockMediaRecorder as unknown as typeof MediaRecorder;
    Object.defineProperty(window.navigator, "mediaDevices", {
      value: {
        enumerateDevices: jest.fn().mockResolvedValue([
          { kind: "audioinput", deviceId: "default-mic", label: "MacBook Air Microphone" },
        ]),
        getUserMedia: jest.fn().mockResolvedValue({
          getAudioTracks: () => [{ label: "MacBook Air Microphone", muted: false, enabled: true, readyState: "live", getSettings: () => ({}) }],
          getTracks: () => [{ stop: jest.fn() }],
        }),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function runDictationCycle() {
    const user = userEvent.setup();
    const startButton = await screen.findByRole("button", { name: /Voice input \(Beta\)/i });
    nowMs = 1000;
    await user.click(startButton);
    const stopButton = await screen.findByRole("button", { name: /Stop voice input \(Beta\)/i });
    nowMs = 2500;
    await user.click(stopButton);
  }

  test("A. successful transcription updates textarea and shows success notice", async () => {
    setUserAgent("Mozilla/5.0 Safari/605.1.15");
    mockTranscribeFetch({ transcript: "I go to the doctor tomorrow" });
    render(<Home />);

    await runDictationCycle();

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Your message" })).toHaveValue(
        "I go to the doctor tomorrow",
      ),
    );
    expect(
      screen.getByText("Transcript inserted. Please check and edit it."),
    ).toBeInTheDocument();
  });

  test("B. empty transcription shows empty transcript error", async () => {
    setUserAgent("Mozilla/5.0 Safari/605.1.15");
    mockTranscribeFetch({ transcript: "" });
    render(<Home />);

    await runDictationCycle();

    expect(
      await screen.findByText(/Speech was recorded, but no usable transcript was produced\./i),
    ).toBeInTheDocument();
  });

  test("C. API failure shows transcription failure message", async () => {
    setUserAgent("Mozilla/5.0 Safari/605.1.15");
    mockTranscribeFetch({}, false);
    render(<Home />);

    await runDictationCycle();

    expect(await screen.findByText("Transcription failed. Please try again.")).toBeInTheDocument();
  });

  test("D. browser detection keeps button available in Safari", async () => {
    setUserAgent("Mozilla/5.0 Safari/605.1.15");
    render(<Home />);

    const button = await screen.findByRole("button", { name: /Voice input \(Beta\)/i });
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
  });

  test("E. browser detection enables dictation in Chrome", async () => {
    setUserAgent("Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36");
    render(<Home />);

    const button = await screen.findByRole("button", { name: /Voice input \(Beta\)/i });
    expect(button).toBeEnabled();

    // No Safari-only warning should appear
    expect(screen.queryByText(/Please use typing in this browser/i)).not.toBeInTheDocument();
  });

  test("F. Chrome MediaRecorder path inserts transcript into textarea", async () => {
    setUserAgent("Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36");
    mockTranscribeFetch({ transcript: "I need help" });

    render(<Home />);
    await runDictationCycle();

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Your message" })).toHaveValue("I need help"),
    );
    expect(screen.getByText("Transcript inserted. Please check and edit it.")).toBeInTheDocument();
  });
});
