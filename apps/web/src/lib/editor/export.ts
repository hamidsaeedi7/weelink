import type Konva from "konva";
import type { Page, Project } from "./types";

export type ExportFormat = "png" | "jpg" | "webp" | "pdf";

export const EXPORT_FORMATS: { key: ExportFormat; label: string; mime: string; ext: string }[] = [
  { key: "png", label: "PNG", mime: "image/png", ext: "png" },
  { key: "jpg", label: "JPG", mime: "image/jpeg", ext: "jpg" },
  { key: "webp", label: "WebP", mime: "image/webp", ext: "webp" },
  { key: "pdf", label: "PDF", mime: "image/png", ext: "pdf" },
];

/** Instagram's chrome covers roughly the top and bottom 250px of a story. */
const SAFE_INSET_Y = 250;
/** Below this, an image is being upscaled enough to look soft when exported. */
const LOW_RES_RATIO = 0.5;

export interface ExportWarning {
  kind: "safe-zone" | "low-res";
  message: string;
}

/**
 * Pre-export checks. These are advisory — the spec asks for warnings, not
 * blocks, because a seller may genuinely want a full-bleed design.
 */
export function collectWarnings(project: Project): ExportWarning[] {
  const warnings: ExportWarning[] = [];
  const { height } = project.canvas;

  let clipped = 0;
  for (const page of project.pages) {
    for (const o of page.objects) {
      if (!o.visible || o.type !== "text") continue;
      const top = o.y;
      const bottom = o.y + o.height;
      if (top < SAFE_INSET_Y || bottom > height - SAFE_INSET_Y) clipped++;
    }
  }
  if (clipped > 0) {
    warnings.push({
      kind: "safe-zone",
      message: `${clipped} متن در محدوده‌ای است که اینستاگرام رویش دکمه نشان می‌دهد — ممکنه دیده نشه.`,
    });
  }
  return warnings;
}

/** Reports images whose natural size is well below their on-canvas size. */
export async function collectImageWarnings(project: Project): Promise<ExportWarning[]> {
  const srcs = new Map<string, number>(); // src -> largest rendered width
  for (const page of project.pages) {
    for (const o of page.objects) {
      if (o.type !== "image" || !o.src) continue;
      srcs.set(o.src, Math.max(srcs.get(o.src) ?? 0, o.width));
    }
  }
  const results = await Promise.all(
    [...srcs.entries()].map(
      ([src, renderedWidth]) =>
        new Promise<boolean>((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img.naturalWidth < renderedWidth * LOW_RES_RATIO);
          img.onerror = () => resolve(false);
          img.src = src;
        }),
    ),
  );
  const lowRes = results.filter(Boolean).length;
  return lowRes
    ? [{ kind: "low-res", message: `${lowRes} تصویر کیفیت پایینی برای این اندازه دارد و ممکنه محو دیده بشه.` }]
    : [];
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * Every image across every page, loaded up front.
 *
 * Multi-page export works by swapping the active page and screenshotting the
 * stage. A page the user never opened has never mounted its images, so without
 * this its export would capture empty placeholders. Warming the browser cache
 * first means each page swap only needs a frame to paint.
 */
async function preloadAllImages(project: Project): Promise<void> {
  const srcs = new Set<string>();
  for (const page of project.pages) {
    for (const o of page.objects) {
      if (o.type === "image" && o.src) srcs.add(o.src);
    }
  }
  await Promise.all(
    [...srcs].map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => resolve(); // a broken image must not stall the export
          img.src = src;
        }),
    ),
  );
  if (typeof document !== "undefined" && document.fonts) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
}

export interface CaptureContext {
  stage: Konva.Stage;
  zoom: number;
  project: Project;
  /** Switches the rendered page; the caller owns the store. */
  setActivePage: (id: string) => void;
  activePageId: string;
}

function capture(stage: Konva.Stage, zoom: number, scale: number, mime: string, quality?: number) {
  // The stage is displayed at `zoom`; scale/zoom restores true design pixels.
  return stage.toDataURL({ pixelRatio: scale / zoom, mimeType: mime, quality });
}

/** Captures one dataURL per page, restoring the original page afterwards. */
export async function capturePages(
  ctx: CaptureContext,
  pages: Page[],
  scale: number,
  mime: string,
  quality?: number,
): Promise<string[]> {
  await preloadAllImages(ctx.project);
  const original = ctx.activePageId;
  const out: string[] = [];
  try {
    for (const page of pages) {
      ctx.setActivePage(page.id);
      await nextFrame();
      out.push(capture(ctx.stage, ctx.zoom, scale, mime, quality));
    }
  } finally {
    // Always put the editor back where the user left it, even on failure.
    ctx.setActivePage(original);
    await nextFrame();
  }
  return out;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const safeName = (s: string) => (s || "story").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 60);

export async function exportImages(
  ctx: CaptureContext,
  format: ExportFormat,
  scale: number,
  pages: Page[],
  projectName: string,
) {
  const def = EXPORT_FORMATS.find((f) => f.key === format)!;
  const quality = format === "jpg" || format === "webp" ? 0.92 : undefined;
  const urls = await capturePages(ctx, pages, scale, def.mime, quality);
  const base = safeName(projectName);

  if (format === "pdf") {
    // Lazy — jsPDF is large and most exports never touch it.
    const { jsPDF } = await import("jspdf");
    const { width, height } = ctx.project.canvas;
    const pdf = new jsPDF({ orientation: height >= width ? "portrait" : "landscape", unit: "px", format: [width, height] });
    urls.forEach((url, i) => {
      if (i > 0) pdf.addPage([width, height], height >= width ? "portrait" : "landscape");
      pdf.addImage(url, "PNG", 0, 0, width, height);
    });
    pdf.save(`${base}.pdf`);
    return;
  }

  if (urls.length === 1) {
    triggerDownload(dataUrlToBlob(urls[0]), `${base}.${def.ext}`);
    return;
  }

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  urls.forEach((url, i) => zip.file(`${base}-${i + 1}.${def.ext}`, dataUrlToBlob(url)));
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${base}.zip`);
}
