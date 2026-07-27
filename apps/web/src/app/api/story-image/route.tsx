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
  },
};

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
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-120px", left: "-120px", width: "360px", height: "360px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "260px", right: "-100px", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex" }} />

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
              fontSize: "56px",
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
