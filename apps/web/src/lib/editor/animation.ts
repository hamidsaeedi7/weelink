import {
  DEFAULT_ANIMATION, DEFAULT_PAGE_DURATION,
  type AnimationType, type Easing, type EditorObject, type ObjectAnimation, type Page,
} from "./types";

export const ANIMATION_OPTIONS: { key: AnimationType; label: string }[] = [
  { key: "none", label: "بدون انیمیشن" },
  { key: "fade", label: "محو شدن" },
  { key: "slideUp", label: "از پایین" },
  { key: "slideDown", label: "از بالا" },
  { key: "slideRight", label: "از راست" },
  { key: "slideLeft", label: "از چپ" },
  { key: "zoomIn", label: "بزرگ شدن" },
  { key: "zoomOut", label: "کوچک شدن" },
  { key: "pop", label: "جهش" },
  { key: "rotateIn", label: "چرخش" },
];

export const EASING_OPTIONS: { key: Easing; label: string }[] = [
  { key: "linear", label: "یکنواخت" },
  { key: "easeOut", label: "نرم" },
  { key: "easeInOut", label: "دوطرفه" },
  { key: "back", label: "کششی" },
];

function ease(p: number, kind: Easing): number {
  switch (kind) {
    case "easeOut":
      return 1 - Math.pow(1 - p, 3);
    case "easeInOut":
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    case "back": {
      // Slight overshoot past the target, then settle — reads as "springy"
      // without needing a real spring simulation.
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    }
    default:
      return p;
  }
}

/** How far slide animations travel, in canvas px. */
const SLIDE_DISTANCE = 260;

export interface AnimState {
  opacity: number;
  dx: number;
  dy: number;
  scale: number;
  rotate: number;
}

const REST: AnimState = { opacity: 1, dx: 0, dy: 0, scale: 1, rotate: 0 };

/**
 * The visual offset an object should have at time `t` (seconds into the page).
 *
 * Returns the RESTING state for anything without an animation, and once the
 * animation has finished — so a paused/stopped editor always shows the final
 * design rather than a half-played frame.
 */
export function animationStateAt(anim: ObjectAnimation | undefined, t: number): AnimState {
  if (!anim || anim.type === "none") return REST;

  const start = anim.delay;
  const end = anim.delay + Math.max(0.01, anim.duration);
  if (t >= end) return REST;
  // Before its turn, an animated object is not on screen yet.
  if (t < start) return { ...REST, opacity: 0, scale: anim.type.startsWith("zoom") || anim.type === "pop" ? 0.8 : 1 };

  const raw = (t - start) / (end - start);
  const p = ease(Math.min(1, Math.max(0, raw)), anim.easing);
  const inv = 1 - p;

  switch (anim.type) {
    case "fade":
      return { ...REST, opacity: p };
    case "slideUp":
      return { ...REST, opacity: p, dy: inv * SLIDE_DISTANCE };
    case "slideDown":
      return { ...REST, opacity: p, dy: -inv * SLIDE_DISTANCE };
    case "slideRight":
      return { ...REST, opacity: p, dx: inv * SLIDE_DISTANCE };
    case "slideLeft":
      return { ...REST, opacity: p, dx: -inv * SLIDE_DISTANCE };
    case "zoomIn":
      return { ...REST, opacity: p, scale: 0.7 + 0.3 * p };
    case "zoomOut":
      return { ...REST, opacity: p, scale: 1.3 - 0.3 * p };
    case "pop":
      return { ...REST, opacity: Math.min(1, p * 2), scale: 0.5 + 0.5 * p };
    case "rotateIn":
      return { ...REST, opacity: p, rotate: inv * -25, scale: 0.85 + 0.15 * p };
    default:
      return REST;
  }
}

/** When the last animation on a page finishes. */
export function animationEndTime(page: Page): number {
  return page.objects.reduce((max, o) => {
    const a = o.animation;
    if (!a || a.type === "none") return max;
    return Math.max(max, a.delay + a.duration);
  }, 0);
}

export function pageDuration(page: Page): number {
  // Never cut an animation off: the page is held at least until everything
  // has finished animating, plus a moment to read it.
  return Math.max(page.duration ?? DEFAULT_PAGE_DURATION, animationEndTime(page) + 0.6);
}

export function totalDuration(pages: Page[]): number {
  return pages.reduce((sum, p) => sum + pageDuration(p), 0);
}

/** Gives each object a staggered delay in layer order — the fastest way to
 *  make a static design feel designed rather than animating one thing. */
export function staggerAnimation(
  objects: EditorObject[],
  type: AnimationType,
  step = 0.12,
): Record<string, ObjectAnimation> {
  const out: Record<string, ObjectAnimation> = {};
  objects.forEach((o, i) => {
    out[o.id] = { ...DEFAULT_ANIMATION, type, delay: Number((i * step).toFixed(2)) };
  });
  return out;
}
