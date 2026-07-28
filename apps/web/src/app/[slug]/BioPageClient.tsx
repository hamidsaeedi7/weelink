"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { ExternalLink, ShoppingBag, FileDown, BookOpen, Zap, CalendarCheck } from "lucide-react";
import { getBgTemplate, bgTemplateBackground } from "@/lib/bg-templates";

const textStyle = { color: "var(--bio-text)" };
const secondaryStyle = { color: "var(--bio-text-secondary)" };

// نوار فروشگاه: اگر شاپ محصول/فایل/دوره داشته باشد، لینک عمومی‌شان نمایش داده می‌شود
// (تعداد هر بخش از قبل، سمت سرور، همراه با خود shop واکشی شده — دیگر fetch جدا لازم نیست)
function StorefrontLinks({ slug, primary, counts }: { slug: string; primary: string; counts: { products: number; files: number; courses: number; services: number } }) {
  const links = [
    counts.products > 0 && { href: `/${slug}/shop`, icon: ShoppingBag, label: "فروشگاه محصولات" },
    counts.files > 0 && { href: `/${slug}/files`, icon: FileDown, label: "فایل‌های دیجیتال" },
    counts.courses > 0 && { href: `/${slug}/courses`, icon: BookOpen, label: "دوره‌های آموزشی" },
    counts.services > 0 && { href: `/${slug}/booking`, icon: CalendarCheck, label: "رزرو نوبت آنلاین" },
  ].filter(Boolean) as { href: string; icon: any; label: string }[];

  if (!links.length) return null;
  return (
    <div className="space-y-2.5 mb-3">
      {links.map((l) => (
        <a key={l.href} href={l.href}
          className="bio-card flex items-center gap-3 w-full px-4 py-3.5
                     transition-all active:scale-[0.98]"
          style={{ borderColor: `${primary}30` }}>
          <l.icon className="w-5 h-5 shrink-0" style={{ color: primary }} />
          <span className="flex-1 text-sm font-medium" style={textStyle}>{l.label}</span>
          <ExternalLink className="w-4 h-4 shrink-0" style={secondaryStyle} />
        </a>
      ))}
    </div>
  );
}

// نوار فلش‌سیل فعال (از خود shop سمت سرور واکشی شده)
function FlashSaleStrip({ sales, primary }: { sales: any[]; primary: string }) {
  // بازبینی دوباره سمت کلاینت چون shop ممکن است تا ۶۰ ثانیه کش شده باشد (ISR + کش Redis)
  const active = sales.filter((s) => s.isActive !== false && new Date(s.endsAt) > new Date());
  if (!active.length) return null;
  return (
    <div className="space-y-2.5 mb-3">
      {active.map((s) => <FlashCard key={s.id} sale={s} primary={primary} />)}
    </div>
  );
}

function FlashCard({ sale, primary }: { sale: any; primary: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(sale.endsAt).getTime() - Date.now()));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [sale.endsAt]);
  if (left <= 0) return null;
  const s = Math.floor(left / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const disc = sale.originalPrice && sale.salePrice
    ? Math.round((1 - Number(sale.salePrice) / Number(sale.originalPrice)) * 100) : 0;
  return (
    <div className="w-full px-4 py-3.5 rounded-2xl border text-center space-y-2"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))", borderColor: "rgba(239,68,68,0.3)", borderRadius: "var(--bio-radius)" }}>
      <div className="flex items-center justify-center gap-2">
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-sm font-bold" style={textStyle}>{sale.title}</span>
        {disc > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white">{disc}٪ تخفیف</span>}
      </div>
      {sale.salePrice && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="line-through" style={secondaryStyle}>{Number(sale.originalPrice).toLocaleString("fa-IR")}</span>
          <span className="font-black" style={{ color: primary }}>{Number(sale.salePrice).toLocaleString("fa-IR")} تومان</span>
        </div>
      )}
      <div className="flex items-center justify-center gap-1.5 text-sm font-mono" style={textStyle}>
        <span className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 font-black">{pad(h)}</span>:
        <span className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 font-black">{pad(m)}</span>:
        <span className="px-2 py-1 rounded-lg bg-black/10 dark:bg-white/10 font-black">{pad(sec)}</span>
      </div>
    </div>
  );
}

// Bento theme switches the block list from a single stacked column to a
// 2-col grid; "rich" block types (media, forms, banners) take the full
// width, simple link-like blocks sit two per row as small tiles.
const BENTO_WIDE_TYPES = new Set([
  "FEATURED", "IMAGE", "VIDEO", "MAP", "EMAIL_CAPTURE", "FAQ",
  "ORDER_FORM", "FLASH_SALE", "TEXT", "DIVIDER", "GROUP",
]);
function bentoSpanClass(block: { type: string }) {
  return BENTO_WIDE_TYPES.has(block.type) ? "col-span-2" : "col-span-1";
}

interface Shop {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bgImageUrl?: string;
  bgTemplate?: string;
  bioTheme?: string;
  primaryColor?: string;
  fontFamily?: string;
  themeId?: string;
  blocks: any[];
  ownerPlan?: string;
  storefrontCounts?: { products: number; files: number; courses: number; services: number };
  activeFlashSales?: any[];
}

export function BioPageClient({ shop }: { shop: Shop }) {
  const primary = shop.primaryColor || "#F97316";
  const theme = shop.bioTheme || "modern";
  const isMinimal = theme === "minimal";
  const isNeo = theme === "neo";
  const isClay = theme === "clay";
  const isBento = theme === "bento";
  // Neo/clay/bento are flat-surface styles that need a uniform, non-photo
  // backdrop to read correctly (neo especially — the card fuses into the
  // page color) so they override the seller's chosen background/photo,
  // same as minimal already did. Modern/glass keep respecting bg/template.
  const flatTheme = isMinimal || isNeo || isClay || isBento;

  const bg = shop.bgImageUrl;
  const template = !bg ? getBgTemplate(shop.bgTemplate) : undefined;

  const background = isMinimal
    ? "#fafafa"
    : isNeo
      ? "#e6e9ef"
      : isClay
        ? "linear-gradient(160deg, #ffd9ec 0%, #d6e4ff 55%, #e2d6ff 100%)"
        : isBento
          ? "linear-gradient(180deg, #f7f8fb 0%, #eef1f6 100%)"
          : bg
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bg}) center/cover no-repeat`
            : template
              ? bgTemplateBackground(template)
              : theme === "glass"
                ? "linear-gradient(135deg, #4338CA 0%, #7C3AED 35%, #DB2777 70%, #0EA5E9 100%)"
                : `linear-gradient(160deg, #0A0A0F 0%, #111122 100%)`;

  return (
    <div
      data-bio-theme={theme}
      className="min-h-screen flex flex-col items-center"
      style={{
        background,
        fontFamily: `'${shop.fontFamily || "Vazirmatn"}', Vazirmatn, sans-serif`,
      }}
    >
      {/* Banner */}
      {shop.bannerUrl && (
        <div className="w-full max-w-lg h-36 relative overflow-hidden">
          <Image src={shop.bannerUrl} alt="" fill sizes="512px" className="object-cover" priority />
        </div>
      )}

      <div className="w-full max-w-lg px-4 pb-16">
        {/* Profile */}
        <div className="flex flex-col items-center pt-10 pb-6 space-y-3">
          {/* Avatar */}
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 shadow-xl"
            style={{
              borderColor: `${primary}60`,
              boxShadow: flatTheme ? "none" : `0 0 25px ${primary}30`,
            }}
          >
            {shop.avatarUrl ? (
              <Image src={shop.avatarUrl} alt={shop.name} fill sizes="80px" className="object-cover" priority />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${primary}88)` }}
              >
                {shop.name[0]}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl font-black" style={textStyle}>{shop.name}</h1>

          {/* Bio */}
          {shop.bio && (
            <p className="text-sm text-center max-w-xs leading-relaxed" style={secondaryStyle}>
              {shop.bio}
            </p>
          )}
        </div>

        {/* فلش‌سیل فعال + لینک فروشگاه/فایل/دوره */}
        <FlashSaleStrip sales={shop.activeFlashSales || []} primary={primary} />
        <StorefrontLinks slug={shop.slug} primary={primary} counts={shop.storefrontCounts || { products: 0, files: 0, courses: 0, services: 0 }} />

        {/* Blocks */}
        <div className={isBento ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}>
          {shop.blocks.map((block: any) => (
            <div key={block.id} className={isBento ? bentoSpanClass(block) : undefined}>
              <BlockRenderer block={block} primaryColor={primary} />
            </div>
          ))}
        </div>

        {/* "Made with Weelink" badge — free pages only (PRO removes branding) */}
        {shop.ownerPlan !== "PRO" && (
          <a
            href="https://weeelink.ir?ref=badge"
            target="_blank"
            rel="noopener noreferrer"
            className="bio-card flex items-center justify-center gap-1.5 mt-10 mx-auto w-fit
                       px-3.5 py-2 text-xs hover:opacity-80 transition-all"
            style={secondaryStyle}
          >
            <span>ساخته شده با</span>
            <span className="font-bold" style={textStyle}>ویلینک</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
