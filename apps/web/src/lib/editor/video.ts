/**
 * Video export using only browser APIs.
 *
 * canvas.captureStream() + MediaRecorder records the live canvas as it plays,
 * so there is no ffmpeg.wasm (~30MB) and no server-side rendering — which
 * matters a lot here: the production box has 2 cores and no ffmpeg, and this
 * audience is on Iranian mobile connections.
 *
 * The catch is container support. Instagram accepts mp4/mov but NOT webm, and
 * MediaRecorder's mp4 support varies by browser. We feature-detect and report
 * honestly rather than handing the seller a file their target app rejects.
 */

export interface VideoSupport {
  supported: boolean;
  mimeType: string | null;
  extension: string;
  /** True when the output is directly postable to Instagram. */
  instagramReady: boolean;
}

const CANDIDATES = [
  { mime: "video/mp4;codecs=h264", ext: "mp4", ig: true },
  { mime: "video/mp4", ext: "mp4", ig: true },
  { mime: "video/webm;codecs=vp9", ext: "webm", ig: false },
  { mime: "video/webm;codecs=vp8", ext: "webm", ig: false },
  { mime: "video/webm", ext: "webm", ig: false },
];

export function detectVideoSupport(): VideoSupport {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return { supported: false, mimeType: null, extension: "webm", instagramReady: false };
  }
  for (const c of CANDIDATES) {
    if (MediaRecorder.isTypeSupported(c.mime)) {
      return { supported: true, mimeType: c.mime, extension: c.ext, instagramReady: c.ig };
    }
  }
  return { supported: false, mimeType: null, extension: "webm", instagramReady: false };
}

export interface RecordOptions {
  canvas: HTMLCanvasElement;
  fps: number;
  durationMs: number;
  mimeType: string;
  /** Advances the design; called every frame with elapsed seconds. */
  onFrame: (elapsedSeconds: number) => void;
  onProgress?: (fraction: number) => void;
}

/**
 * Drives the animation and records the canvas for `durationMs`.
 *
 * Frames are pushed manually via requestFrame() rather than relying on the
 * stream's own capture rate, so the recording stays in step with the drawing
 * even when a frame takes longer than its slot to render.
 */
export function recordCanvas({
  canvas, fps, durationMs, mimeType, onFrame, onProgress,
}: RecordOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let stream: MediaStream;
    try {
      stream = canvas.captureStream(0);
    } catch (e) {
      reject(e);
      return;
    }
    const track = stream.getVideoTracks()[0] as any;
    const canRequest = typeof track?.requestFrame === "function";
    if (!canRequest) {
      // Without manual frame control the stream would capture at its own
      // pace and drop animation steps; fall back to an auto-rate stream.
      stream.getTracks().forEach((t) => t.stop());
      stream = canvas.captureStream(fps);
    }

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onerror = (e) => reject(e);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: mimeType }));
    };

    const frameMs = 1000 / fps;
    const started = performance.now();
    recorder.start();

    const tick = () => {
      const elapsed = performance.now() - started;
      if (elapsed >= durationMs) {
        onFrame(durationMs / 1000);
        if (canRequest) track.requestFrame();
        onProgress?.(1);
        // A short grace period so the encoder flushes the final frames.
        setTimeout(() => recorder.state !== "inactive" && recorder.stop(), 120);
        return;
      }
      onFrame(elapsed / 1000);
      if (canRequest) track.requestFrame();
      onProgress?.(elapsed / durationMs);
      setTimeout(tick, frameMs);
    };
    setTimeout(tick, frameMs);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
