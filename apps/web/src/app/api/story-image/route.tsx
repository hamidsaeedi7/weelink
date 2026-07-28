import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

// nodejs runtime (not edge): edge functions hang in the self-hosted standalone
// server behind Docker (same constraint as opengraph-image.tsx).
export const runtime = "nodejs";

const WIDTH = 1080;

const RATIOS: Record<string, number> = {
  story: 1920,    // 9:16 — Instagram/Telegram story
  post: 1080,     // 1:1 — feed post
  portrait: 1350, // 4:5 — feed portrait
};

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function loadFont(file: string): Buffer | null {
  for (const base of [
    join(process.cwd(), "apps/web/public/fonts", file),
    join(process.cwd(), "public/fonts", file),
  ]) {
    try {
      return readFileSync(base);
    } catch {
      /* try next path */
    }
  }
  return null;
}

const fontRegular = loadFont("Vazirmatn-Regular.ttf");
const fontBold = loadFont("Vazirmatn-Bold.ttf");
const fontBlack = loadFont("Vazirmatn-Black.ttf") || fontBold;

// Font picker — all free for every plan. Persian faces render Farsi glyphs
// directly; English faces are Latin-only, so Vazirmatn is always registered
// as a fallback in the `font-family` stack (satori honors CSS fallback
// chains) so Persian text never falls back to tofu when an English face
// is selected — only the Latin glyphs (numbers, English handles) pick it up.
type FontKey = "vazir" | "lalezar" | "sahel" | "shabnam" | "poppins" | "montserrat" | "bebasneue" | "playfair" | "oswald";

interface FontDef { label: string; cssName: string; regular: string; bold: string }

const FONT_DEFS: Record<FontKey, FontDef> = {
  vazir: { label: "وزیر", cssName: "Vazirmatn", regular: "Vazirmatn-Regular.ttf", bold: "Vazirmatn-Bold.ttf" },
  lalezar: { label: "لاله‌زار", cssName: "Lalezar", regular: "Lalezar-Regular.ttf", bold: "Lalezar-Regular.ttf" },
  sahel: { label: "ساحل", cssName: "Sahel", regular: "Sahel-Regular.ttf", bold: "Sahel-Bold.ttf" },
  shabnam: { label: "شبنم", cssName: "Shabnam", regular: "Shabnam-Regular.ttf", bold: "Shabnam-Bold.ttf" },
  poppins: { label: "Poppins", cssName: "Poppins", regular: "Poppins-Regular.ttf", bold: "Poppins-Bold.ttf" },
  montserrat: { label: "Montserrat", cssName: "Montserrat", regular: "Montserrat-Regular.ttf", bold: "Montserrat-Bold.ttf" },
  bebasneue: { label: "Bebas Neue", cssName: "Bebas Neue", regular: "BebasNeue-Regular.ttf", bold: "BebasNeue-Regular.ttf" },
  playfair: { label: "Playfair Display", cssName: "Playfair Display", regular: "PlayfairDisplay-Regular.ttf", bold: "PlayfairDisplay-Bold.ttf" },
  oswald: { label: "Oswald", cssName: "Oswald", regular: "Oswald-Regular.ttf", bold: "Oswald-Bold.ttf" },
};

const fontFileCache = new Map<string, Buffer | null>();
function loadFontCached(file: string): Buffer | null {
  if (!fontFileCache.has(file)) fontFileCache.set(file, loadFont(file));
  return fontFileCache.get(file) ?? null;
}

function buildFontStack(key: string) {
  const def = FONT_DEFS[key as FontKey] || FONT_DEFS.vazir;
  const fonts: { name: string; data: Buffer; weight: 400 | 700 | 900; style: "normal" }[] = [];
  const reg = loadFontCached(def.regular);
  const bold = loadFontCached(def.bold);
  if (reg) fonts.push({ name: def.cssName, data: reg, weight: 400, style: "normal" });
  if (bold) fonts.push({ name: def.cssName, data: bold, weight: 700, style: "normal" }, { name: def.cssName, data: bold, weight: 900, style: "normal" });
  // Persian fallback, unless the selected face already is Vazirmatn.
  if (def.cssName !== "Vazirmatn") {
    if (fontRegular) fonts.push({ name: "Vazirmatn", data: fontRegular, weight: 400, style: "normal" });
    if (fontBold) fonts.push({ name: "Vazirmatn", data: fontBold, weight: 700, style: "normal" });
    if (fontBlack) fonts.push({ name: "Vazirmatn", data: fontBlack, weight: 900, style: "normal" });
  }
  return { cssStack: `${def.cssName}, Vazirmatn`, fonts };
}

type MotifKey = "tag" | "bolt" | "haftsin" | "heart" | "pomegranate" | "sparkle" | "crescent" | "flower" | "gift";

interface TemplateConfig {
  label: string;
  background: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
  priceColor: string;
  headline: string;
  cardBg: string;
  textOnBg: string;
  subtleText: string;
  motif: MotifKey;
  motifCutColor?: string;
}

export const STORY_TEMPLATES: Record<string, TemplateConfig> = {
  sale: {
    label: "فروش ویژه",
    background: "linear-gradient(160deg, #7C2D12 0%, #EA580C 45%, #F97316 100%)",
    badgeBg: "#FFFFFF",
    badgeText: "#C2410C",
    accent: "#FFE4CC",
    priceColor: "#FFFFFF",
    headline: "فروش ویژه",
    cardBg: "rgba(0,0,0,0.28)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.75)",
    motif: "tag",
  },
  blackfriday: {
    label: "بلک فرایدی",
    background: "linear-gradient(180deg, #000000 0%, #18181B 100%)",
    badgeBg: "#FACC15",
    badgeText: "#000000",
    accent: "#FACC15",
    priceColor: "#FACC15",
    headline: "جمعه سیاه",
    cardBg: "rgba(250,204,21,0.08)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.6)",
    motif: "bolt",
  },
  nowruz: {
    label: "عید نوروز",
    background: "linear-gradient(160deg, #0EA88A 0%, #15803D 55%, #CA8A04 130%)",
    badgeBg: "#FFFFFF",
    badgeText: "#0EA88A",
    accent: "#FEF9C3",
    priceColor: "#FFFFFF",
    headline: "عید نوروز مبارک",
    cardBg: "rgba(0,0,0,0.22)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.8)",
    motif: "haftsin",
  },
  valentine: {
    label: "ولنتاین",
    background: "linear-gradient(160deg, #BE123C 0%, #EC4899 55%, #F9A8D4 130%)",
    badgeBg: "#FFFFFF",
    badgeText: "#BE123C",
    accent: "#FFE4EC",
    priceColor: "#FFFFFF",
    headline: "ولنتاین مبارک",
    cardBg: "rgba(0,0,0,0.22)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.8)",
    motif: "heart",
  },
  yalda: {
    label: "شب یلدا",
    background: "linear-gradient(160deg, #3B0764 0%, #7C2D12 100%)",
    badgeBg: "#FBBF24",
    badgeText: "#3B0764",
    accent: "#FBBF24",
    priceColor: "#FBBF24",
    headline: "شب یلدا مبارک",
    cardBg: "rgba(251,191,36,0.10)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.7)",
    motif: "pomegranate",
  },
  newproduct: {
    label: "محصول جدید",
    background: "linear-gradient(160deg, #08090C 0%, #0EA88A 140%)",
    badgeBg: "#3CE0BE",
    badgeText: "#08090C",
    accent: "#3CE0BE",
    priceColor: "#FFFFFF",
    headline: "تازه رسید",
    cardBg: "rgba(60,224,190,0.08)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.7)",
    motif: "sparkle",
  },
  ramadan: {
    label: "ماه رمضان",
    background: "linear-gradient(160deg, #1E1B4B 0%, #4C1D95 55%, #7C3AED 130%)",
    badgeBg: "#FBBF24",
    badgeText: "#1E1B4B",
    accent: "#FBBF24",
    priceColor: "#FBBF24",
    headline: "ماه رمضان مبارک",
    cardBg: "rgba(251,191,36,0.10)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.75)",
    motif: "crescent",
    motifCutColor: "#3D2B77",
  },
  eidfitr: {
    label: "عید فطر",
    background: "linear-gradient(160deg, #065F46 0%, #0EA88A 55%, #FBBF24 140%)",
    badgeBg: "#FFFFFF",
    badgeText: "#065F46",
    accent: "#FDE68A",
    priceColor: "#FFFFFF",
    headline: "عید فطر مبارک",
    cardBg: "rgba(0,0,0,0.22)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.8)",
    motif: "crescent",
    motifCutColor: "#0C7A5F",
  },
  mothersday: {
    label: "روز مادر",
    background: "linear-gradient(160deg, #831843 0%, #DB2777 55%, #F9A8D4 130%)",
    badgeBg: "#FFFFFF",
    badgeText: "#831843",
    accent: "#FBCFE8",
    priceColor: "#FFFFFF",
    headline: "روز مادر مبارک",
    cardBg: "rgba(0,0,0,0.2)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.8)",
    motif: "flower",
  },
  fathersday: {
    label: "روز پدر",
    background: "linear-gradient(160deg, #0F172A 0%, #1E3A8A 55%, #3B82F6 140%)",
    badgeBg: "#FFFFFF",
    badgeText: "#0F172A",
    accent: "#93C5FD",
    priceColor: "#FFFFFF",
    headline: "روز پدر مبارک",
    cardBg: "rgba(0,0,0,0.22)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.75)",
    motif: "gift",
  },
  flashsale: {
    label: "فروش لحظه‌ای",
    background: "linear-gradient(160deg, #7F1D1D 0%, #DC2626 55%, #FACC15 140%)",
    badgeBg: "#111827",
    badgeText: "#FACC15",
    accent: "#FEF08A",
    priceColor: "#FFFFFF",
    headline: "فروش لحظه‌ای",
    cardBg: "rgba(0,0,0,0.3)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.75)",
    motif: "bolt",
  },
  clearance: {
    label: "حراج پایان فصل",
    background: "linear-gradient(160deg, #1E293B 0%, #334155 55%, #F97316 140%)",
    badgeBg: "#F97316",
    badgeText: "#1E293B",
    accent: "#FDBA74",
    priceColor: "#FDBA74",
    headline: "حراج پایان فصل",
    cardBg: "rgba(0,0,0,0.25)",
    textOnBg: "#FFFFFF",
    subtleText: "rgba(255,255,255,0.7)",
    motif: "tag",
  },
};

/** Decorative occasion motifs — built only from flex boxes, borderRadius circles,
 * and basic `rotate()` transforms since satori has no SVG-path/clip-path support. */
function TagMotif({ size = 220, color }: { size?: number; color: string }) {
  return (
    <div style={{ display: "flex", width: size, height: size * 0.7, alignItems: "center", justifyContent: "center", transform: "rotate(-18deg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: size * 0.9, height: size * 0.56, background: color, borderRadius: size * 0.1, padding: `0 ${size * 0.12}px` }}>
        <div style={{ display: "flex", width: size * 0.16, height: size * 0.16, borderRadius: "50%", background: "rgba(255,255,255,0.85)" }} />
      </div>
    </div>
  );
}

function BoltMotif({ size = 220, color }: { size?: number; color: string }) {
  return (
    <div style={{ display: "flex", width: size, height: size, alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "absolute", display: "flex", width: size * 0.62, height: size * 0.62, background: color, borderRadius: size * 0.08, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.32, height: size * 0.32, background: color, borderRadius: size * 0.06, transform: "rotate(45deg)", opacity: 0.7 }} />
    </div>
  );
}

function HaftsinMotif({ size = 220 }: { size?: number }) {
  const colors = ["#22C55E", "#EF4444", "#EAB308", "#F59E0B", "#A855F7", "#84CC16", "#F3F4F6"];
  return (
    <div style={{ display: "flex", width: size, height: size * 0.5, flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.045 }}>
      <div style={{ display: "flex", gap: size * 0.045 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ display: "flex", width: size * 0.09, height: size * 0.09, borderRadius: "50%", background: c }} />
        ))}
      </div>
      <div style={{ display: "flex", width: size * 0.78, height: size * 0.03, borderRadius: size * 0.02, background: "rgba(255,255,255,0.4)" }} />
    </div>
  );
}

function HeartMotif({ size = 220, color }: { size?: number; color: string }) {
  const half = size * 0.55;
  return (
    <div style={{ display: "flex", width: size, height: size, position: "relative" }}>
      <div style={{ position: "absolute", display: "flex", width: half, height: half, background: color, borderRadius: size * 0.06, transform: "rotate(45deg)", top: size * 0.32, left: (size - half) / 2 }} />
      <div style={{ position: "absolute", display: "flex", width: half, height: half, borderRadius: "50%", background: color, top: 0, left: (size - half) / 2 - half / 2 }} />
      <div style={{ position: "absolute", display: "flex", width: half, height: half, borderRadius: "50%", background: color, top: 0, left: (size - half) / 2 + half / 2 }} />
    </div>
  );
}

function PomegranateMotif({ size = 220 }: { size?: number }) {
  const seed = (k: string) => <div key={k} style={{ display: "flex", width: size * 0.08, height: size * 0.08, borderRadius: "50%", background: "#FCA5A5" }} />;
  return (
    <div style={{ display: "flex", width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #EF4444, #7F1D1D)", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: size * 0.045 }}>
      <div style={{ display: "flex", gap: size * 0.045 }}>{["a", "b", "c"].map(seed)}</div>
      <div style={{ display: "flex", gap: size * 0.045 }}>{["d", "e", "f"].map(seed)}</div>
    </div>
  );
}

function SparkleMotif({ size = 220, color }: { size?: number; color: string }) {
  return (
    <div style={{ display: "flex", width: size, height: size, alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "absolute", display: "flex", width: size, height: size * 0.16, background: color, borderRadius: size * 0.08 }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.16, height: size, background: color, borderRadius: size * 0.08 }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.7, height: size * 0.12, background: color, borderRadius: size * 0.06, transform: "rotate(45deg)" }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.7, height: size * 0.12, background: color, borderRadius: size * 0.06, transform: "rotate(-45deg)" }} />
    </div>
  );
}

function CrescentMotif({ size = 220, color, cut }: { size?: number; color: string; cut: string }) {
  return (
    <div style={{ display: "flex", width: size, height: size, borderRadius: "50%", background: color, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", display: "flex", width: size * 0.88, height: size * 0.88, borderRadius: "50%", background: cut, top: -size * 0.06, left: size * 0.26 }} />
    </div>
  );
}

function FlowerMotif({ size = 220, petal, center }: { size?: number; petal: string; center: string }) {
  const p = size * 0.36;
  return (
    <div style={{ display: "flex", width: size, height: size, position: "relative" }}>
      <div style={{ position: "absolute", display: "flex", width: p, height: p, borderRadius: "50%", background: petal, top: 0, left: (size - p) / 2 }} />
      <div style={{ position: "absolute", display: "flex", width: p, height: p, borderRadius: "50%", background: petal, top: size - p, left: (size - p) / 2 }} />
      <div style={{ position: "absolute", display: "flex", width: p, height: p, borderRadius: "50%", background: petal, top: (size - p) / 2, left: 0 }} />
      <div style={{ position: "absolute", display: "flex", width: p, height: p, borderRadius: "50%", background: petal, top: (size - p) / 2, left: size - p }} />
      <div style={{ position: "absolute", display: "flex", width: p * 0.9, height: p * 0.9, borderRadius: "50%", background: center, top: (size - p * 0.9) / 2, left: (size - p * 0.9) / 2 }} />
    </div>
  );
}

function GiftMotif({ size = 220, box, ribbon }: { size?: number; box: string; ribbon: string }) {
  return (
    <div style={{ display: "flex", width: size, height: size, position: "relative" }}>
      <div style={{ position: "absolute", display: "flex", width: size * 0.94, height: size * 0.74, top: size * 0.22, left: size * 0.03, background: box, borderRadius: size * 0.06 }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.16, height: size * 0.74, top: size * 0.22, left: size * 0.42, background: ribbon }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.94, height: size * 0.14, top: size * 0.5, left: size * 0.03, background: ribbon }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.24, height: size * 0.16, top: size * 0.06, left: size * 0.22, background: ribbon, borderRadius: `${size * 0.08}px ${size * 0.08}px 0 0` }} />
      <div style={{ position: "absolute", display: "flex", width: size * 0.24, height: size * 0.16, top: size * 0.06, left: size * 0.5, background: ribbon, borderRadius: `${size * 0.08}px ${size * 0.08}px 0 0` }} />
    </div>
  );
}

function renderMotif(tpl: TemplateConfig, px: (n: number) => number) {
  const c = tpl.accent;
  switch (tpl.motif) {
    case "tag": return <TagMotif size={px(240)} color={c} />;
    case "bolt": return <BoltMotif size={px(240)} color={c} />;
    case "haftsin": return <HaftsinMotif size={px(260)} />;
    case "heart": return <HeartMotif size={px(240)} color={c} />;
    case "pomegranate": return <PomegranateMotif size={px(240)} />;
    case "sparkle": return <SparkleMotif size={px(240)} color={c} />;
    case "crescent": return <CrescentMotif size={px(240)} color={c} cut={tpl.motifCutColor || "#111827"} />;
    case "flower": return <FlowerMotif size={px(240)} petal={c} center={tpl.priceColor} />;
    case "gift": return <GiftMotif size={px(240)} box={c} ribbon={tpl.badgeText} />;
    default: return null;
  }
}

function formatToman(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

/**
 * satori does not implement the Unicode Bidi Algorithm — it lays out
 * space-separated words left-to-right regardless of `direction`, while still
 * shaping each word's own Arabic-script glyphs correctly. For a plain RTL
 * phrase (no embedded LTR runs/digits), reversing word order before handing
 * the string to ImageResponse produces the correct visual reading order.
 */
function rtlWords(str: string) {
  return str.split(" ").reverse().join(" ");
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const templateKey = sp.get("template") || "sale";
  const tpl = STORY_TEMPLATES[templateKey] || STORY_TEMPLATES.sale;

  const title = sp.get("title") || "محصول ویژه";
  const priceRaw = sp.get("price");
  const discountPercentRaw = sp.get("discountPercent");
  const shopName = sp.get("shopName") || "ویلینک";
  const shopSlug = sp.get("shopSlug") || "";
  const image = sp.get("image");
  const shopLogo = sp.get("shopLogo");
  const titleSizeRaw = sp.get("titleSize");
  const titleSize = titleSizeRaw ? Math.min(72, Math.max(36, Number(titleSizeRaw))) : 56;
  const fontKey = sp.get("font") || "vazir";

  // Freeform drag positions (percent of canvas), set by the editor's drag
  // handles. Defaults reproduce the pre-drag centered layout.
  const clampPct = (v: string | null, fallback: number) => {
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? Math.min(96, Math.max(4, n)) : fallback;
  };
  const imageX = clampPct(sp.get("imageX"), 50);
  const imageY = clampPct(sp.get("imageY"), 40);
  const titleX = clampPct(sp.get("titleX"), 50);
  const titleY = clampPct(sp.get("titleY"), 66);

  const ratioKey = sp.get("ratio") || "story";

  const price = priceRaw ? Number(priceRaw) : null;
  const discountPercent = discountPercentRaw ? Number(discountPercentRaw) : 0;
  const discountedPrice = price && discountPercent > 0 ? Math.round((price * (100 - discountPercent)) / 100) : null;

  // Custom-logo/social-handle/watermark removal/background/HD export are Pro
  // perks. The public shop endpoint already exposes `ownerPlan` for the free
  // "Made with Weelink" badge elsewhere — reuse the same signal here instead
  // of trusting the query string. Checked BEFORE quality/dimensions are
  // resolved so a crafted `quality=hd` can't bypass the gate.
  const wantsProFeatures = Boolean(
    sp.get("hideWatermark") || sp.get("customLogo") || sp.get("socialHandle") || sp.get("bgImage") || sp.get("quality")
  );
  let isPro = false;
  if (wantsProFeatures && shopSlug) {
    try {
      const res = await fetch(`${API_ORIGIN}/api/v1/shops/${shopSlug}`, { next: { revalidate: 300 } });
      if (res.ok) {
        const shop = await res.json();
        isPro = (shop.ownerPlan || shop.data?.ownerPlan) === "PRO";
      }
    } catch { /* default to non-Pro on lookup failure */ }
  }

  const customLogo = isPro ? sp.get("customLogo") : null;
  const socialHandle = isPro ? sp.get("socialHandle") : null;
  const hideWatermark = isPro && sp.get("hideWatermark") === "1";
  const bgImage = isPro ? sp.get("bgImage") : null;
  const effectiveLogo = customLogo || shopLogo;
  const { cssStack: fontStack, fonts: fontList } = buildFontStack(fontKey);

  const qualityScale = isPro && sp.get("quality") === "hd" ? 2 : 1;
  const HEIGHT = (RATIOS[ratioKey] || RATIOS.story) * qualityScale;
  const WIDTH_OUT = WIDTH * qualityScale;
  const scale = HEIGHT / RATIOS.story; // folds in both the ratio's shape AND the quality multiplier
  const px = (n: number) => Math.round(n * scale);
  // Fonts never scale up past what the tall story format uses at 1x — only shrink for squarer
  // canvases, but DO scale up with qualityScale so HD exports stay crisp at the larger pixel size.
  const fpx = (n: number) => Math.round(n * Math.min(1, scale / qualityScale) * qualityScale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          ...(bgImage
            ? { backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: tpl.background }),
          fontFamily: fontStack,
          position: "relative",
          padding: `${px(64)}px ${px(56)}px`,
          direction: "rtl",
        }}
      >
        {/* Custom Pro background gets a legibility overlay instead of the ambient decor */}
        {bgImage && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", background: "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0.7) 100%)" }} />
        )}
        {!bgImage && (
          <div style={{ position: "absolute", top: `${-px(120)}px`, left: `${-px(120)}px`, width: `${px(360)}px`, height: `${px(360)}px`, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex" }} />
        )}
        {!bgImage && (
          <div style={{ position: "absolute", bottom: `${px(160)}px`, right: `${-px(60)}px`, display: "flex", opacity: 0.26 }}>{renderMotif(tpl, px)}</div>
        )}

        {/* Top bar: shop brand */}
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: `${px(16)}px` }}>
          {effectiveLogo && (
            <div style={{ display: "flex", width: `${px(64)}px`, height: `${px(64)}px`, borderRadius: `${px(20)}px`, overflow: "hidden", border: `${px(2)}px solid ${tpl.accent}` }}>
              <img src={effectiveLogo} width={px(64)} height={px(64)} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", direction: "rtl", fontSize: `${fpx(30)}px`, fontWeight: 700, color: tpl.textOnBg }}>{rtlWords(shopName)}</div>
            {socialHandle ? (
              <div style={{ display: "flex", direction: "ltr", fontSize: `${fpx(20)}px`, color: tpl.subtleText }}>{socialHandle}</div>
            ) : (
              shopSlug && <div style={{ display: "flex", direction: "ltr", fontSize: `${fpx(20)}px`, color: tpl.subtleText }}>{`weeelink.ir/${shopSlug}`}</div>
            )}
          </div>
        </div>

        {/* Occasion badge */}
        <div style={{ display: "flex", marginTop: `${px(48)}px` }}>
          <div
            style={{
              display: "flex",
              direction: "rtl",
              background: tpl.badgeBg,
              color: tpl.badgeText,
              fontSize: `${fpx(34)}px`,
              fontWeight: 900,
              padding: `${px(16)}px ${px(36)}px`,
              borderRadius: "999px",
            }}
          >
            {rtlWords(tpl.headline)}
          </div>
        </div>

        {/* Center stage: product image + title + price, each freely repositioned by the editor's drag handles (percent of this box, defaults reproduce the old centered layout) */}
        <div style={{ display: "flex", flex: 1, position: "relative" }}>
          {image ? (
            <div
              style={{
                position: "absolute",
                display: "flex",
                left: `${imageX}%`,
                top: `${imageY}%`,
                transform: "translate(-50%, -50%)",
                width: `${px(620)}px`,
                height: `${px(620)}px`,
                borderRadius: `${px(40)}px`,
                overflow: "hidden",
                border: `${px(4)}px solid ${tpl.accent}`,
                background: tpl.cardBg,
              }}
            >
              <img src={image} width={px(620)} height={px(620)} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
          ) : (
            !bgImage && (
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  left: `${imageX}%`,
                  top: `${imageY}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${px(620)}px`,
                  height: `${px(300)}px`,
                  borderRadius: `${px(40)}px`,
                  background: tpl.cardBg,
                  border: `${px(4)}px solid ${tpl.accent}`,
                }}
              />
            )
          )}

          <div
            style={{
              position: "absolute",
              display: "flex",
              left: `${titleX}%`,
              top: `${titleY}%`,
              transform: "translate(-50%, -50%)",
              justifyContent: "center",
              direction: "rtl",
              fontSize: `${fpx(titleSize)}px`,
              fontWeight: 900,
              color: tpl.textOnBg,
              textAlign: "center",
              maxWidth: `${px(880)}px`,
              lineHeight: 1.3,
            }}
          >
            {rtlWords(title)}
          </div>

          {price !== null && discountedPrice !== null && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                left: `${titleX}%`,
                top: `${Math.min(94, titleY + 11)}%`,
                transform: "translate(-50%, -50%)",
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: `${px(24)}px`,
              }}
            >
              <div style={{ display: "flex", direction: "rtl", fontSize: `${fpx(68)}px`, fontWeight: 900, color: tpl.priceColor }}>
                {formatToman(discountedPrice)}
              </div>
              <div style={{ display: "flex", direction: "rtl", fontSize: `${fpx(34)}px`, color: tpl.subtleText, textDecoration: "line-through" }}>
                {formatToman(price)}
              </div>
              <div
                style={{
                  display: "flex",
                  direction: "rtl",
                  background: tpl.badgeBg,
                  color: tpl.badgeText,
                  fontSize: `${fpx(28)}px`,
                  fontWeight: 900,
                  padding: `${px(8)}px ${px(20)}px`,
                  borderRadius: "999px",
                }}
              >
                {discountPercent}٪ تخفیف
              </div>
            </div>
          )}
          {price !== null && discountedPrice === null && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                left: `${titleX}%`,
                top: `${Math.min(94, titleY + 9)}%`,
                transform: "translate(-50%, -50%)",
                direction: "rtl",
                fontSize: `${fpx(68)}px`,
                fontWeight: 900,
                color: tpl.priceColor,
              }}
            >
              {formatToman(price)}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: `${px(12)}px` }}>
          <div style={{ display: "flex", direction: "rtl", fontSize: `${fpx(32)}px`, fontWeight: 700, color: tpl.textOnBg }}>
            {rtlWords("برای خرید به بیو مراجعه کن")}
          </div>
          {!hideWatermark && (
            <div style={{ display: "flex", direction: "rtl", fontSize: `${fpx(20)}px`, color: tpl.subtleText }}>{rtlWords("ساخته‌شده با ویلینک")}</div>
          )}
        </div>
      </div>
    ),
    {
      width: WIDTH_OUT,
      height: HEIGHT,
      fonts: fontList,
    }
  );
}
