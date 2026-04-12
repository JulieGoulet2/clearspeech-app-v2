/**
 * audioUtils.ts
 *
 * Converts any audio Blob (WebM/Opus from Chrome, MP4 from Safari, etc.)
 * into a WAV file using the browser's AudioContext.
 *
 * WHY: OpenAI's transcription models handle WAV (PCM) much more reliably
 * than Chrome's WebM/Opus output, which often produces empty transcripts.
 *
 * Fallback: if AudioContext decoding fails for any reason, the original
 * blob is returned as-is so the upload still proceeds.
 */

/**
 * Decodes any audio Blob and re-encodes it as a 16-bit mono PCM WAV File.
 * Falls back to the original blob if decoding fails.
 * @param audioBlob - Raw audio blob from MediaRecorder (any format)
 * @returns A File object ready to upload
 */
export async function convertToWav(audioBlob: Blob): Promise<File> {
  console.info("[audioUtils] convertToWav start — input:", {
    size: audioBlob.size,
    type: audioBlob.type,
  });

  // Sanity check
  if (audioBlob.size === 0) {
    throw new Error("Audio blob is empty — nothing to convert.");
  }

  // Try WAV conversion via AudioContext
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.info("[audioUtils] arrayBuffer size:", arrayBuffer.byteLength);

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("AudioContext not available in this browser.");
    }

    const audioCtx = new AudioContextClass();
    console.info("[audioUtils] AudioContext created, sampleRate:", audioCtx.sampleRate);

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      console.info("[audioUtils] decodeAudioData success:", {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
      });
    } catch (decodeErr) {
      audioCtx.close();
      console.warn("[audioUtils] decodeAudioData FAILED — falling back to raw blob:", decodeErr);
      // Fall back to sending the original blob
      return blobToFile(audioBlob);
    }

    audioCtx.close();

    const wavBuffer = encodeWAV(audioBuffer);
    console.info("[audioUtils] WAV encoded, size:", wavBuffer.byteLength);
    return new File([wavBuffer], "recording.wav", { type: "audio/wav" });

  } catch (err) {
    // Unexpected error — fall back to original blob rather than crashing
    console.warn("[audioUtils] Unexpected error in convertToWav, falling back to raw blob:", err);
    return blobToFile(audioBlob);
  }
}

/** Wraps a raw audio Blob into a named File for upload. */
function blobToFile(blob: Blob): File {
  const ext = blob.type.includes("mp4") ? "m4a" : "webm";
  const filename = `recording.${ext}`;
  console.info("[audioUtils] Fallback: returning raw blob as", filename, "type:", blob.type);
  return new File([blob], filename, { type: blob.type || "audio/webm" });
}

/**
 * Encodes an AudioBuffer as a 16-bit mono PCM WAV ArrayBuffer.
 */
function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = 1;
  const sampleRate = audioBuffer.sampleRate;
  const bitDepth = 16;

  const samples = audioBuffer.getChannelData(0);
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);                                         // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // float32 → int16
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
