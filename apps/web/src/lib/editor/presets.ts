import {
  EDITOR_VERSION, type Project, type Page, type EditorObject,
  type TextObject, type ImageObject, type ShapeObject, type ShapeKind,
} from "./types";

export const CANVAS_PRESETS = [
  { key: "story", label: "استوری اینستاگرام", width: 1080, height: 1920, ratio: "9/16" },
  { key: "post", label: "پست مربعی", width: 1080, height: 1080, ratio: "1/1" },
  { key: "portrait", label: "پست عمودی", width: 1080, height: 1350, ratio: "4/5" },
  { key: "reelCover", label: "کاور ریلز", width: 1080, height: 1920, ratio: "9/16" },
  { key: "telegramPost", label: "پست تلگرام", width: 1280, height: 1280, ratio: "1/1" },
  { key: "whatsappStatus", label: "استاتوس واتساپ", width: 1080, height: 1920, ratio: "9/16" },
] as const;

export type CanvasPresetKey = (typeof CANVAS_PRESETS)[number]["key"] | "custom";

/**
 * Fonts the canvas can actually render. Konva draws through the browser's
 * text engine, so anything with an @font-face in globals.css works — but the
 * face must be LOADED before we draw, otherwise the first paint silently
 * falls back. See ensureFont().
 */
export const EDITOR_FONTS = [
  { key: "Vazirmatn", label: "وزیر", group: "fa" as const, weights: [400, 700] },
  { key: "Estedad", label: "استعداد", group: "fa" as const, weights: [400] },
  { key: "Shabnam", label: "شبنم", group: "fa" as const, weights: [400, 700] },
  { key: "Sahel", label: "ساحل", group: "fa" as const, weights: [400, 700] },
  { key: "Samim", label: "صمیم", group: "fa" as const, weights: [400] },
  { key: "Lalezar", label: "لاله‌زار", group: "fa" as const, weights: [400] },
  { key: "Poppins", label: "Poppins", group: "en" as const, weights: [400, 700] },
  { key: "Montserrat", label: "Montserrat", group: "en" as const, weights: [400, 700] },
  { key: "Oswald", label: "Oswald", group: "en" as const, weights: [400, 700] },
  { key: "PlayfairDisplay", label: "Playfair", group: "en" as const, weights: [400, 700] },
  { key: "BebasNeue", label: "Bebas Neue", group: "en" as const, weights: [400] },
];

/**
 * @font-face is lazy — the browser only fetches a face once something uses
 * it. Canvas drawing does NOT trigger that fetch reliably, so a freshly
 * picked font can paint as a fallback and only correct itself on some later
 * repaint. Awaiting document.fonts.load() before redrawing removes that flash.
 */
const fontCache = new Map<string, Promise<void>>();
export function ensureFont(family: string, weight = 400): Promise<void> {
  const cacheKey = `${family}:${weight}`;
  const hit = fontCache.get(cacheKey);
  if (hit) return hit;
  const p = (async () => {
    if (typeof document === "undefined" || !document.fonts) return;
    try {
      await document.fonts.load(`${weight} 64px "${family}"`, "آزمایش Test");
    } catch { /* a missing face must not break the editor */ }
  })();
  fontCache.set(cacheKey, p);
  return p;
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Object factories ────────────────────────────────────────────────────────
// Centralised so every new object gets consistent defaults, and so the
// canvas/toolbar never has to know the full object shape.

export function createText(partial: Partial<TextObject> = {}): TextObject {
  return {
    id: uid(),
    type: "text",
    name: "متن",
    x: 140,
    y: 700,
    width: 800,
    height: 160,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    text: "متن خود را بنویسید",
    fontFamily: "Vazirmatn",
    fontSize: 72,
    fontWeight: 700,
    fill: "#ffffff",
    align: "center",
    direction: "rtl",
    lineHeight: 1.4,
    letterSpacing: 0,
    ...partial,
  };
}

export function createImage(src: string, partial: Partial<ImageObject> = {}): ImageObject {
  return {
    id: uid(),
    type: "image",
    name: "تصویر",
    x: 240,
    y: 480,
    width: 600,
    height: 600,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    src,
    cornerRadius: 24,
    ...partial,
  };
}

export function createShape(shape: ShapeKind, partial: Partial<ShapeObject> = {}): ShapeObject {
  return {
    id: uid(),
    type: "shape",
    name: "شکل",
    x: 340,
    y: 800,
    width: 400,
    height: 400,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    shape,
    fill: "#14C7A5",
    cornerRadius: shape === "rect" ? 32 : 0,
    ...partial,
  };
}

export function createEmptyPage(): Page {
  return {
    id: uid(),
    background: { type: "gradient", from: "#0F172A", to: "#14C7A5", angle: 135 },
    objects: [],
  };
}

export function createProject(presetKey: CanvasPresetKey = "story", name = "استوری بدون عنوان"): Project {
  const preset = CANVAS_PRESETS.find((p) => p.key === presetKey) ?? CANVAS_PRESETS[0];
  return {
    version: EDITOR_VERSION,
    id: uid(),
    name,
    canvas: { width: preset.width, height: preset.height },
    presetKey,
    pages: [createEmptyPage()],
    updatedAt: new Date().toISOString(),
  };
}

/** A non-empty starting design, so the editor never opens as a blank void. */
export function createStarterProject(): Project {
  const project = createProject("story");
  const objects: EditorObject[] = [
    createShape("rect", {
      name: "نوار عنوان",
      x: 90, y: 620, width: 900, height: 210,
      fill: "rgba(0,0,0,0.35)", cornerRadius: 40,
    }),
    createText({
      name: "عنوان",
      text: "فروش ویژه پاییزه",
      x: 90, y: 660, width: 900, height: 130,
      fontSize: 96, fontFamily: "Vazirmatn", fontWeight: 700,
    }),
    createText({
      name: "زیرعنوان",
      text: "تا ۵۰٪ تخفیف — فقط تا پایان هفته",
      x: 90, y: 850, width: 900, height: 80,
      fontSize: 44, fontWeight: 400, fill: "rgba(255,255,255,0.85)",
    }),
  ];
  project.pages[0].objects = objects;
  return project;
}
