import { createImage, createShape, createText, uid } from "./presets";
import { EDITOR_VERSION, type Background, type EditorObject, type Project } from "./types";

/**
 * Turns shop data into ready-made, EDITABLE story designs.
 *
 * This is the successor to the old satori generator. The important difference
 * is that the output is a normal editor Project — the seller gets a finished
 * design in one step but can then change anything, which the render-to-PNG
 * approach could never allow.
 */
export interface ProductStoryInput {
  name: string;
  imageSrc?: string;
  oldPrice?: number | null;
  newPrice?: number | null;
  handle?: string;
  cta?: string;
  occasion?: string;
}

const W = 1080;
const H = 1920;

/** Persian digits with thousand separators, e.g. ۲۵۰٬۰۰۰ تومان */
function money(n: number): string {
  return `${n.toLocaleString("fa-IR")} تومان`;
}

function discountOf(input: ProductStoryInput): number | null {
  const { oldPrice, newPrice } = input;
  if (!oldPrice || !newPrice || newPrice >= oldPrice) return null;
  return Math.round((1 - newPrice / oldPrice) * 100);
}

export interface StoryStyle {
  key: string;
  label: string;
  /** Swatch for the picker, so a style is recognisable before generating. */
  swatch: string;
  build: (input: ProductStoryInput) => { background: Background; objects: EditorObject[] };
}

/**
 * Shared vertical rhythm. Every style places the same information in the same
 * reading order — occasion, image, name, price, CTA, handle — so switching
 * style never makes the seller re-learn the design. Only the treatment differs.
 */
interface Slots {
  occasionY: number;
  imageY: number;
  imageSize: number;
  nameY: number;
  priceY: number;
  ctaY: number;
  handleY: number;
}

function slots(hasImage: boolean): Slots {
  return hasImage
    ? { occasionY: 300, imageY: 400, imageSize: 620, nameY: 1090, priceY: 1250, ctaY: 1450, handleY: 1720 }
    : { occasionY: 480, imageY: 0, imageSize: 0, nameY: 720, priceY: 1000, ctaY: 1280, handleY: 1720 };
}

/** Price block: struck-through old price above, live price below. */
function priceObjects(
  input: ProductStoryInput,
  y: number,
  opts: { color: string; mutedColor: string; font: string; size?: number },
): EditorObject[] {
  const out: EditorObject[] = [];
  const { oldPrice, newPrice } = input;
  const main = newPrice ?? oldPrice;
  if (!main) return out;

  if (oldPrice && newPrice && newPrice < oldPrice) {
    out.push(
      createText({
        name: "قیمت قبلی",
        text: money(oldPrice),
        x: 90, y, width: 900, height: 60,
        fontSize: 44, fontWeight: 400, align: "center",
        fill: opts.mutedColor, fontFamily: opts.font,
        textDecoration: "line-through",
      }),
    );
  }
  out.push(
    createText({
      name: "قیمت",
      text: money(main),
      x: 90, y: oldPrice && newPrice && newPrice < oldPrice ? y + 70 : y,
      width: 900, height: 100,
      fontSize: opts.size ?? 76, fontWeight: 700, align: "center",
      fill: opts.color, fontFamily: opts.font,
    }),
  );
  return out;
}

function handleObject(input: ProductStoryInput, y: number, fill: string, font: string): EditorObject[] {
  if (!input.handle?.trim()) return [];
  return [
    createText({
      name: "آیدی",
      text: input.handle.trim(),
      x: 90, y, width: 900, height: 60,
      fontSize: 38, fontWeight: 400, align: "center",
      fill, fontFamily: font, direction: "ltr",
    }),
  ];
}

function imageObject(input: ProductStoryInput, s: Slots, cornerRadius: number): EditorObject[] {
  if (!input.imageSrc) return [];
  return [
    createImage(input.imageSrc, {
      name: "تصویر محصول",
      x: (W - s.imageSize) / 2,
      y: s.imageY,
      width: s.imageSize,
      height: s.imageSize,
      cornerRadius,
    }),
  ];
}

export const STORY_STYLES: StoryStyle[] = [
  {
    key: "minimal",
    label: "مینیمال",
    swatch: "#FAFAFA",
    build: (input) => {
      const s = slots(!!input.imageSrc);
      const d = discountOf(input);
      return {
        background: { type: "solid", color: "#FAFAFA" },
        objects: [
          ...(input.occasion
            ? [createText({ name: "مناسبت", text: input.occasion, x: 90, y: s.occasionY, width: 900, height: 60, fontSize: 36, fontWeight: 400, align: "center", fill: "#9CA3AF", letterSpacing: 6 })]
            : []),
          ...imageObject(input, s, 12),
          createText({ name: "نام محصول", text: input.name, x: 120, y: s.nameY, width: 840, height: 140, fontSize: 84, fontWeight: 700, align: "center", fill: "#111827" }),
          // A hairline rule instead of a filled badge — restraint is the style.
          createShape("rect", { name: "خط", x: 480, y: s.nameY + 160, width: 120, height: 4, fill: "#111827", cornerRadius: 2 }),
          ...priceObjects(input, s.priceY, { color: "#111827", mutedColor: "#9CA3AF", font: "Vazirmatn" }),
          ...(d ? [createText({ name: "تخفیف", text: `${d.toLocaleString("fa-IR")}٪ تخفیف`, x: 90, y: s.ctaY, width: 900, height: 70, fontSize: 44, fontWeight: 700, align: "center", fill: "#111827" })] : []),
          ...(input.cta ? [createText({ name: "دعوت به اقدام", text: input.cta, x: 90, y: s.ctaY + 90, width: 900, height: 70, fontSize: 40, fontWeight: 400, align: "center", fill: "#6B7280" })] : []),
          ...handleObject(input, s.handleY, "#9CA3AF", "Vazirmatn"),
        ],
      };
    },
  },
  {
    key: "modern",
    label: "مدرن",
    swatch: "linear-gradient(135deg,#0F172A,#14C7A5)",
    build: (input) => {
      const s = slots(!!input.imageSrc);
      const d = discountOf(input);
      return {
        background: { type: "gradient", from: "#0F172A", to: "#14C7A5", angle: 145 },
        objects: [
          ...(d
            ? [
                createShape("rect", { name: "نشان تخفیف", x: 760, y: 300, width: 220, height: 220, fill: "#14C7A5", cornerRadius: 110 }),
                createText({ name: "درصد", text: `${d.toLocaleString("fa-IR")}٪`, x: 760, y: 375, width: 220, height: 80, fontSize: 72, fontWeight: 700, align: "center", fill: "#04241F" }),
              ]
            : []),
          ...imageObject(input, s, 40),
          ...(input.occasion
            ? [createText({ name: "مناسبت", text: input.occasion, x: 90, y: s.occasionY, width: 900, height: 60, fontSize: 38, fontWeight: 400, align: "center", fill: "rgba(255,255,255,0.7)", letterSpacing: 4 })]
            : []),
          createText({ name: "نام محصول", text: input.name, x: 90, y: s.nameY, width: 900, height: 150, fontSize: 92, fontWeight: 700, align: "center", fill: "#FFFFFF" }),
          ...priceObjects(input, s.priceY, { color: "#14C7A5", mutedColor: "rgba(255,255,255,0.55)", font: "Vazirmatn" }),
          ...(input.cta
            ? [
                createShape("rect", { name: "دکمه", x: 290, y: s.ctaY, width: 500, height: 110, fill: "#FFFFFF", cornerRadius: 55 }),
                createText({ name: "دعوت به اقدام", text: input.cta, x: 290, y: s.ctaY + 30, width: 500, height: 60, fontSize: 44, fontWeight: 700, align: "center", fill: "#0F172A" }),
              ]
            : []),
          ...handleObject(input, s.handleY, "rgba(255,255,255,0.65)", "Vazirmatn"),
        ],
      };
    },
  },
  {
    key: "luxury",
    label: "لوکس",
    swatch: "linear-gradient(135deg,#0B0B0D,#C9A227)",
    build: (input) => {
      const s = slots(!!input.imageSrc);
      return {
        background: { type: "solid", color: "#0B0B0D" },
        objects: [
          // Thin gold frame — the signature of the treatment.
          createShape("rect", { name: "قاب", x: 60, y: 200, width: 960, height: 1520, fill: "rgba(0,0,0,0)", stroke: "#C9A227", strokeWidth: 2, cornerRadius: 0 }),
          ...(input.occasion
            ? [createText({ name: "مناسبت", text: input.occasion, x: 120, y: s.occasionY, width: 840, height: 60, fontSize: 34, fontWeight: 400, align: "center", fill: "#C9A227", letterSpacing: 10 })]
            : []),
          ...imageObject(input, s, 0),
          createText({ name: "نام محصول", text: input.name, x: 140, y: s.nameY, width: 800, height: 150, fontSize: 82, fontWeight: 400, align: "center", fill: "#F5F1E6", fontFamily: "PlayfairDisplay" }),
          createShape("rect", { name: "خط", x: 490, y: s.nameY + 170, width: 100, height: 1, fill: "#C9A227" }),
          ...priceObjects(input, s.priceY, { color: "#C9A227", mutedColor: "rgba(245,241,230,0.4)", font: "Vazirmatn", size: 64 }),
          ...(input.cta
            ? [createText({ name: "دعوت به اقدام", text: input.cta, x: 140, y: s.ctaY, width: 800, height: 70, fontSize: 38, fontWeight: 400, align: "center", fill: "#F5F1E6", letterSpacing: 4 })]
            : []),
          ...handleObject(input, s.handleY, "#C9A227", "Vazirmatn"),
        ],
      };
    },
  },
  {
    key: "sales",
    label: "فروش‌محور",
    swatch: "linear-gradient(135deg,#7F1D1D,#FACC15)",
    build: (input) => {
      const s = slots(!!input.imageSrc);
      const d = discountOf(input);
      return {
        background: { type: "gradient", from: "#7F1D1D", to: "#F59E0B", angle: 160 },
        objects: [
          // Urgency first: the discount is the loudest element on the page.
          ...(d
            ? [
                createShape("rect", { name: "نوار تخفیف", x: 0, y: 250, width: W, height: 200, fill: "#FACC15" }),
                createText({ name: "درصد", text: `${d.toLocaleString("fa-IR")}٪ تخفیف`, x: 90, y: 300, width: 900, height: 110, fontSize: 110, fontWeight: 700, align: "center", fill: "#7F1D1D" }),
              ]
            : []),
          ...imageObject(input, s, 24),
          createText({ name: "نام محصول", text: input.name, x: 90, y: s.nameY, width: 900, height: 150, fontSize: 88, fontWeight: 700, align: "center", fill: "#FFFFFF" }),
          ...priceObjects(input, s.priceY, { color: "#FACC15", mutedColor: "rgba(255,255,255,0.6)", font: "Vazirmatn", size: 84 }),
          ...(input.cta
            ? [
                createShape("rect", { name: "دکمه", x: 240, y: s.ctaY, width: 600, height: 120, fill: "#FACC15", cornerRadius: 24 }),
                createText({ name: "دعوت به اقدام", text: input.cta, x: 240, y: s.ctaY + 32, width: 600, height: 60, fontSize: 48, fontWeight: 700, align: "center", fill: "#7F1D1D" }),
              ]
            : []),
          ...handleObject(input, s.handleY, "rgba(255,255,255,0.8)", "Vazirmatn"),
        ],
      };
    },
  },
  {
    key: "dark",
    label: "تیره",
    swatch: "#0A0A0A",
    build: (input) => {
      const s = slots(!!input.imageSrc);
      const d = discountOf(input);
      return {
        background: { type: "solid", color: "#0A0A0A" },
        objects: [
          ...imageObject(input, s, 32),
          ...(input.occasion
            ? [createText({ name: "مناسبت", text: input.occasion, x: 90, y: s.occasionY, width: 900, height: 60, fontSize: 36, fontWeight: 400, align: "center", fill: "#71717A", letterSpacing: 8 })]
            : []),
          createText({ name: "نام محصول", text: input.name, x: 90, y: s.nameY, width: 900, height: 150, fontSize: 96, fontWeight: 700, align: "center", fill: "#FAFAFA" }),
          ...priceObjects(input, s.priceY, { color: "#FAFAFA", mutedColor: "#52525B", font: "Vazirmatn" }),
          ...(d
            ? [
                createShape("rect", { name: "نشان", x: 400, y: s.ctaY - 20, width: 280, height: 80, fill: "rgba(0,0,0,0)", stroke: "#FAFAFA", strokeWidth: 2, cornerRadius: 40 }),
                createText({ name: "درصد", text: `${d.toLocaleString("fa-IR")}٪ تخفیف`, x: 400, y: s.ctaY, width: 280, height: 50, fontSize: 36, fontWeight: 700, align: "center", fill: "#FAFAFA" }),
              ]
            : []),
          ...(input.cta ? [createText({ name: "دعوت به اقدام", text: input.cta, x: 90, y: s.ctaY + 110, width: 900, height: 60, fontSize: 38, fontWeight: 400, align: "center", fill: "#A1A1AA" })] : []),
          ...handleObject(input, s.handleY, "#52525B", "Vazirmatn"),
        ],
      };
    },
  },
  {
    key: "persian",
    label: "سنتی ایرانی",
    swatch: "linear-gradient(135deg,#0F3D3E,#C9A227)",
    build: (input) => {
      const s = slots(!!input.imageSrc);
      const d = discountOf(input);
      return {
        background: { type: "gradient", from: "#0F3D3E", to: "#1B5E5F", angle: 150 },
        objects: [
          createShape("rect", { name: "قاب", x: 70, y: 210, width: 940, height: 1500, fill: "rgba(0,0,0,0)", stroke: "#C9A227", strokeWidth: 3, cornerRadius: 24 }),
          ...(input.occasion
            ? [createText({ name: "مناسبت", text: input.occasion, x: 120, y: s.occasionY, width: 840, height: 80, fontSize: 52, fontWeight: 400, align: "center", fill: "#C9A227", fontFamily: "Lalezar" })]
            : []),
          ...imageObject(input, s, 20),
          createText({ name: "نام محصول", text: input.name, x: 120, y: s.nameY, width: 840, height: 150, fontSize: 92, fontWeight: 400, align: "center", fill: "#FDF6E3", fontFamily: "Lalezar" }),
          ...priceObjects(input, s.priceY, { color: "#C9A227", mutedColor: "rgba(253,246,227,0.45)", font: "Vazirmatn" }),
          ...(d ? [createText({ name: "درصد", text: `${d.toLocaleString("fa-IR")}٪ تخفیف`, x: 120, y: s.ctaY, width: 840, height: 80, fontSize: 56, fontWeight: 400, align: "center", fill: "#FDF6E3", fontFamily: "Lalezar" })] : []),
          ...(input.cta ? [createText({ name: "دعوت به اقدام", text: input.cta, x: 120, y: s.ctaY + 100, width: 840, height: 60, fontSize: 38, fontWeight: 400, align: "center", fill: "rgba(253,246,227,0.75)" })] : []),
          ...handleObject(input, s.handleY, "#C9A227", "Vazirmatn"),
        ],
      };
    },
  },
];

export function buildProductStory(input: ProductStoryInput, style: StoryStyle): Project {
  const { background, objects } = style.build(input);
  return {
    version: EDITOR_VERSION,
    id: uid(),
    name: `${input.name || "محصول"} — ${style.label}`,
    canvas: { width: W, height: H },
    presetKey: "story",
    pages: [{ id: uid(), background, objects }],
    updatedAt: new Date().toISOString(),
  };
}

export { discountOf };
