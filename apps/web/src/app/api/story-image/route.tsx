import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

// nodejs runtime (not edge): edge functions hang in the self-hosted standalone
// server behind Docker (same constraint as opengraph-image.tsx).
export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1920;

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

function renderMotif(tpl: TemplateConfig) {
  const c = tpl.accent;
  switch (tpl.motif) {
    case "tag": return <TagMotif size={240} color={c} />;
    case "bolt": return <BoltMotif size={240} color={c} />;
    case "haftsin": return <HaftsinMotif size={260} />;
    case "heart": return <HeartMotif size={240} color={c} />;
    case "pomegranate": return <PomegranateMotif size={240} />;
    case "sparkle": return <SparkleMotif size={240} color={c} />;
    case "crescent": return <CrescentMotif size={240} color={c} cut={tpl.motifCutColor || "#111827"} />;
    case "flower": return <FlowerMotif size={240} petal={c} center={tpl.priceColor} />;
    case "gift": return <GiftMotif size={240} box={c} ribbon={tpl.badgeText} />;
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

  const price = priceRaw ? Number(priceRaw) : null;
  const discountPercent = discountPercentRaw ? Number(discountPercentRaw) : 0;
  const discountedPrice = price && discountPercent > 0 ? Math.round((price * (100 - discountPercent)) / 100) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: tpl.background,
          fontFamily: "Vazirmatn",
          position: "relative",
          padding: "64px 56px",
          direction: "rtl",
        }}
      >
        {/* Decorative ambiance + occasion motif */}
        <div style={{ position: "absolute", top: "-120px", left: "-120px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "160px", right: "-60px", display: "flex", opacity: 0.26 }}>{renderMotif(tpl)}</div>

        {/* Top bar: shop brand */}
        <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "16px" }}>
          {shopLogo && (
            <div style={{ display: "flex", width: "64px", height: "64px", borderRadius: "20px", overflow: "hidden", border: `2px solid ${tpl.accent}` }}>
              <img src={shopLogo} width={64} height={64} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", direction: "rtl", fontSize: "30px", fontWeight: 700, color: tpl.textOnBg }}>{rtlWords(shopName)}</div>
            {shopSlug && <div style={{ display: "flex", direction: "ltr", fontSize: "20px", color: tpl.subtleText }}>{`weeelink.ir/${shopSlug}`}</div>}
          </div>
        </div>

        {/* Occasion badge */}
        <div style={{ display: "flex", marginTop: "48px" }}>
          <div
            style={{
              display: "flex",
              direction: "rtl",
              background: tpl.badgeBg,
              color: tpl.badgeText,
              fontSize: "34px",
              fontWeight: 900,
              padding: "16px 36px",
              borderRadius: "999px",
            }}
          >
            {rtlWords(tpl.headline)}
          </div>
        </div>

        {/* Center card: product */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            gap: "36px",
          }}
        >
          {image ? (
            <div
              style={{
                display: "flex",
                width: "620px",
                height: "620px",
                borderRadius: "40px",
                overflow: "hidden",
                border: `4px solid ${tpl.accent}`,
                background: tpl.cardBg,
              }}
            >
              <img src={image} width={620} height={620} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                width: "620px",
                height: "300px",
                borderRadius: "40px",
                background: tpl.cardBg,
                border: `4px solid ${tpl.accent}`,
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              direction: "rtl",
              fontSize: `${titleSize}px`,
              fontWeight: 900,
              color: tpl.textOnBg,
              textAlign: "center",
              maxWidth: "880px",
              lineHeight: 1.3,
            }}
          >
            {rtlWords(title)}
          </div>

          {price !== null && discountedPrice !== null && (
            <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: "24px" }}>
              <div style={{ display: "flex", direction: "rtl", fontSize: "68px", fontWeight: 900, color: tpl.priceColor }}>
                {formatToman(discountedPrice)}
              </div>
              <div style={{ display: "flex", direction: "rtl", fontSize: "34px", color: tpl.subtleText, textDecoration: "line-through" }}>
                {formatToman(price)}
              </div>
              <div
                style={{
                  display: "flex",
                  direction: "rtl",
                  background: tpl.badgeBg,
                  color: tpl.badgeText,
                  fontSize: "28px",
                  fontWeight: 900,
                  padding: "8px 20px",
                  borderRadius: "999px",
                }}
              >
                {discountPercent}٪ تخفیف
              </div>
            </div>
          )}
          {price !== null && discountedPrice === null && (
            <div style={{ display: "flex", direction: "rtl", fontSize: "68px", fontWeight: 900, color: tpl.priceColor }}>
              {formatToman(price)}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", direction: "rtl", fontSize: "32px", fontWeight: 700, color: tpl.textOnBg }}>
            {rtlWords("برای خرید به بیو مراجعه کن")}
          </div>
          <div style={{ display: "flex", direction: "rtl", fontSize: "20px", color: tpl.subtleText }}>{rtlWords("ساخته‌شده با ویلینک")}</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        ...(fontRegular ? [{ name: "Vazirmatn", data: fontRegular, weight: 400 as const, style: "normal" as const }] : []),
        ...(fontBold ? [{ name: "Vazirmatn", data: fontBold, weight: 700 as const, style: "normal" as const }] : []),
        ...(fontBlack ? [{ name: "Vazirmatn", data: fontBlack, weight: 900 as const, style: "normal" as const }] : []),
      ],
    }
  );
}
