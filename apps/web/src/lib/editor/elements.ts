import { createImage, createShape, createText } from "./presets";
import type { EditorObject } from "./types";

/**
 * Ready-made design elements.
 *
 * Badges and buttons are built as a SINGLE text object using the highlight
 * background added in phase 7, rather than a rect plus a separate text node.
 * One object means dragging it moves the whole thing, and there is no way for
 * the label and its pill to drift apart — which a two-object group would
 * allow until real grouping exists.
 *
 * Icons are SVG data URIs rendered as image objects, so they inherit
 * everything images already support (resize, corner radius, opacity, flip)
 * with no new object type and no Konva.Path scaling maths.
 */

export interface ElementDef {
  key: string;
  label: string;
  category: string;
  /** Small inline preview for the picker grid. */
  preview: { kind: "badge" | "icon" | "frame" | "shape"; color: string; text?: string; svg?: string };
  build: () => EditorObject[];
}

export const ELEMENT_CATEGORIES = [
  { key: "badge", label: "برچسب" },
  { key: "cta", label: "دکمه" },
  { key: "icon", label: "آیکون" },
  { key: "frame", label: "قاب" },
  { key: "decor", label: "تزئینی" },
];

/** Encodes an SVG string for use as an image src. */
function svgUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const icon = (path: string, color: string, viewBox = "0 0 24 24") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="${color}"><path d="${path}"/></svg>`;

const ICON_PATHS = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2zm0 10.9a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm8.4-11.2a1.5 1.5 0 11-3.1 0 1.5 1.5 0 013.1 0z",
  telegram:
    "M21.9 4.3L18.6 20c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.2 13.1 1.4 11.6c-1-.3-1.1-1 .2-1.5l19-7.3c.9-.3 1.6.2 1.3 1.5z",
  whatsapp:
    "M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2z",
  phone:
    "M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z",
  location:
    "M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  star: "M12 2l2.9 6.3 6.8.8-5 4.7 1.3 6.8L12 17.3 6 20.6l1.3-6.8-5-4.7 6.8-.8L12 2z",
  heart:
    "M12 21s-7.5-4.7-9.5-9A5.3 5.3 0 0112 5.7 5.3 5.3 0 0121.5 12c-2 4.3-9.5 9-9.5 9z",
  cart:
    "M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM6.2 5h14.6l-2 8H8.2L6.2 5zM3 2h2l.6 2H21a1 1 0 011 1.2l-2.3 9.4a1.5 1.5 0 01-1.5 1.1H7.6L7 17H4a1 1 0 010-2h1.6L3 4V2z",
};

/** A pill label — one object, using the text highlight from phase 7. */
function pill(text: string, fill: string, color: string, fontSize = 56): EditorObject[] {
  return [
    createText({
      name: text,
      text,
      x: 340, y: 400, width: 400, height: 80,
      fontSize, fontWeight: 700, align: "center",
      fill: color,
      backgroundFill: fill,
      backgroundPadding: 28,
      backgroundRadius: 999,
    }),
  ];
}

function iconObject(key: keyof typeof ICON_PATHS, color: string, size = 160): EditorObject[] {
  return [
    createImage(svgUri(icon(ICON_PATHS[key], color)), {
      name: key,
      x: (1080 - size) / 2,
      y: 900,
      width: size,
      height: size,
      cornerRadius: 0,
    }),
  ];
}

export const ELEMENTS: ElementDef[] = [
  // ── برچسب ──
  { key: "off50", label: "٪۵۰ تخفیف", category: "badge",
    preview: { kind: "badge", color: "#EF4444", text: "٪۵۰" },
    build: () => pill("٪۵۰ تخفیف", "#EF4444", "#FFFFFF") },
  { key: "new", label: "جدید", category: "badge",
    preview: { kind: "badge", color: "#14C7A5", text: "جدید" },
    build: () => pill("جدید", "#14C7A5", "#04241F", 52) },
  { key: "special", label: "پیشنهاد ویژه", category: "badge",
    preview: { kind: "badge", color: "#FACC15", text: "ویژه" },
    build: () => pill("پیشنهاد ویژه", "#FACC15", "#7F1D1D", 48) },
  { key: "free", label: "ارسال رایگان", category: "badge",
    preview: { kind: "badge", color: "#3B82F6", text: "رایگان" },
    build: () => pill("ارسال رایگان", "#3B82F6", "#FFFFFF", 44) },
  { key: "limited", label: "تعداد محدود", category: "badge",
    preview: { kind: "badge", color: "#7C3AED", text: "محدود" },
    build: () => pill("تعداد محدود", "#7C3AED", "#FFFFFF", 44) },

  // ── دکمه ──
  { key: "cta-order", label: "سفارش بده", category: "cta",
    preview: { kind: "badge", color: "#14C7A5", text: "سفارش" },
    build: () => pill("همین حالا سفارش بده", "#14C7A5", "#04241F", 44) },
  { key: "cta-bio", label: "لینک در بایو", category: "cta",
    preview: { kind: "badge", color: "#FFFFFF", text: "بایو" },
    build: () => pill("لینک در بایو", "#FFFFFF", "#0F172A", 44) },
  { key: "cta-swipe", label: "بالا بکش", category: "cta",
    preview: { kind: "badge", color: "#0F172A", text: "↑" },
    build: () => pill("↑ بالا بکش", "#0F172A", "#FFFFFF", 44) },
  { key: "cta-dm", label: "دایرکت بده", category: "cta",
    preview: { kind: "badge", color: "#EC4899", text: "دایرکت" },
    build: () => pill("دایرکت بده", "#EC4899", "#FFFFFF", 44) },

  // ── آیکون ──
  ...(["instagram", "telegram", "whatsapp", "phone", "location", "cart", "star", "heart"] as const).map(
    (k): ElementDef => ({
      key: `icon-${k}`,
      label: k,
      category: "icon",
      preview: { kind: "icon", color: "#FFFFFF", svg: icon(ICON_PATHS[k], "currentColor") },
      build: () => iconObject(k, "#FFFFFF"),
    }),
  ),

  // ── قاب ──
  { key: "frame-thin", label: "قاب ساده", category: "frame",
    preview: { kind: "frame", color: "#FFFFFF" },
    build: () => [createShape("rect", { name: "قاب", x: 70, y: 200, width: 940, height: 1520, fill: "rgba(0,0,0,0)", stroke: "#FFFFFF", strokeWidth: 4, cornerRadius: 0 })] },
  { key: "frame-round", label: "قاب گرد", category: "frame",
    preview: { kind: "frame", color: "#14C7A5" },
    build: () => [createShape("rect", { name: "قاب", x: 70, y: 200, width: 940, height: 1520, fill: "rgba(0,0,0,0)", stroke: "#14C7A5", strokeWidth: 6, cornerRadius: 48 })] },
  { key: "frame-gold", label: "قاب طلایی", category: "frame",
    preview: { kind: "frame", color: "#C9A227" },
    build: () => [createShape("rect", { name: "قاب", x: 90, y: 240, width: 900, height: 1440, fill: "rgba(0,0,0,0)", stroke: "#C9A227", strokeWidth: 3, cornerRadius: 16 })] },

  // ── تزئینی ──
  { key: "underline", label: "زیرخط", category: "decor",
    preview: { kind: "shape", color: "#14C7A5" },
    build: () => [createShape("rect", { name: "زیرخط", x: 440, y: 1000, width: 200, height: 10, fill: "#14C7A5", cornerRadius: 5 })] },
  { key: "band", label: "نوار عریض", category: "decor",
    preview: { kind: "shape", color: "#EF4444" },
    build: () => [createShape("rect", { name: "نوار", x: 0, y: 820, width: 1080, height: 180, fill: "rgba(239,68,68,0.9)", cornerRadius: 0 })] },
  { key: "scrim", label: "سایه پایین", category: "decor",
    preview: { kind: "shape", color: "rgba(0,0,0,0.6)" },
    build: () => [createShape("rect", { name: "سایه", x: 0, y: 1300, width: 1080, height: 620, fill: "rgba(0,0,0,0.55)", cornerRadius: 0 })] },
  { key: "dot", label: "دایره رنگی", category: "decor",
    preview: { kind: "shape", color: "#FACC15" },
    build: () => [createShape("ellipse", { name: "دایره", x: 390, y: 700, width: 300, height: 300, fill: "#FACC15" })] },
];
