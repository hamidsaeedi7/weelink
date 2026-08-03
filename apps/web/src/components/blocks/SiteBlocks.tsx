"use client";

import { createContext, useContext } from "react";
import { Star, ChevronLeft, MapPin } from "lucide-react";
import { BioIcon } from "./bio-icons";
import { BrandLogo, PLATFORM_META } from "./brand-icons";
import { toPersianNumber } from "@/lib/utils";

/**
 * Mini-site block renderers.
 *
 * Everything here paints with the `--bio-*` tokens (set by
 * [data-bio-theme][data-bio-mode] on the page root) plus the seller's
 * primaryColor, so a block looks correct under all 12 theme/mode
 * combinations without any per-theme branch.
 */

export interface BioRenderContext {
  primaryColor: string;
  slug: string;
  /** real shop products, used by PRODUCT_GRID in `auto` mode */
  products: any[];
}

const BioCtx = createContext<BioRenderContext>({
  primaryColor: "#0EA88A",
  slug: "",
  products: [],
});

export const BioContextProvider = BioCtx.Provider;
export const useBioContext = () => useContext(BioCtx);

const text = { color: "var(--bio-text)" };
const dim = { color: "var(--bio-text-secondary)" };
const radius = { borderRadius: "var(--bio-radius)" };

interface Block {
  id: string;
  type: string;
  label?: string;
  url?: string;
  icon?: string;
  data?: Record<string, any>;
}

/** `data.items` is user-authored JSON; never assume it is an array. */
function items(block: Block): any[] {
  const v = block.data?.items;
  return Array.isArray(v) ? v : [];
}

/** Section heading shared by every block that has an optional title. */
function SectionTitle({ title, moreLabel, moreUrl }: { title?: string; moreLabel?: string; moreUrl?: string }) {
  if (!title && !moreLabel) return null;
  return (
    <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
      {title ? <h2 className="text-sm font-bold" style={text}>{title}</h2> : <span />}
      {moreLabel && moreUrl && (
        <a href={moreUrl} className="flex items-center gap-0.5 text-xs shrink-0" style={dim}>
          {moreLabel}
          <ChevronLeft aria-hidden="true" className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

// ─── HERO ─────────────────────────────────────────────────────────────────────

const HERO_HEIGHTS: Record<string, string> = { sm: "9rem", md: "13rem", lg: "18rem" };

export function HeroBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const { primaryColor } = useBioContext();
  const image = block.data?.imageUrl;
  const overlay = Number(block.data?.overlay ?? 60) / 100;
  const height = HERO_HEIGHTS[block.data?.height as string] || HERO_HEIGHTS.md;

  return (
    // -mx-4 cancels the page's horizontal padding so the hero runs edge to
    // edge like the reference designs, without the page itself losing padding.
    <div className="-mx-4 overflow-hidden" style={{ borderRadius: 0 }}>
      <div
        className="relative flex flex-col items-center justify-center text-center px-6 gap-2"
        style={{
          height,
          background: image
            ? `url(${image}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}66)`,
        }}
      >
        {image && overlay > 0 && (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, rgba(0,0,0,${overlay + 0.15}), rgba(0,0,0,${overlay * 0.6}))` }}
          />
        )}
        {/* Text sits on a photo or a saturated gradient in every configuration,
            so it is always white with a shadow rather than --bio-text, which
            would go dark (and vanish) in light mode. */}
        <div className="relative z-10 space-y-1.5">
          <h2 className="text-2xl font-black text-white" style={{ textShadow: "0 2px 12px rgba(0,0,0,.45)" }}>
            {block.label}
          </h2>
          {block.data?.subtitle && (
            <p className="text-sm text-white/85 leading-relaxed" style={{ textShadow: "0 1px 8px rgba(0,0,0,.4)" }}>
              {block.data.subtitle}
            </p>
          )}
          {block.data?.ctaLabel && (
            <a
              href={block.url || "#"}
              onClick={onClick}
              className="inline-flex items-center justify-center mt-2 min-h-[2.75rem] px-6 rounded-full
                         text-sm font-bold text-white shadow-lg active:scale-[0.97] transition-transform"
              style={{ background: primaryColor }}
            >
              {block.data.ctaLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TRUST BAR ────────────────────────────────────────────────────────────────

export function TrustBarBlock({ block }: { block: Block }) {
  const { primaryColor } = useBioContext();
  const list = items(block).slice(0, 4);
  if (!list.length) return null;
  return (
    <div className={`grid gap-2 ${list.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {list.map((it, i) => (
        <div key={i} className="bio-card flex flex-col items-center gap-1 px-2 py-3 text-center">
          <BioIcon name={it.icon} className="w-5 h-5" style={{ color: primaryColor }} />
          <span className="text-[11px] font-bold leading-tight" style={text}>{it.title}</span>
          {it.subtitle && <span className="text-[10px] leading-tight" style={dim}>{it.subtitle}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── CATEGORY CHIPS ───────────────────────────────────────────────────────────

export function CategoryChipsBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const { primaryColor } = useBioContext();
  const shape = block.data?.shape || "circle";
  const list = items(block);
  if (!list.length) return null;

  if (shape === "pill") {
    return (
      <div>
        <SectionTitle title={block.label} />
        <div className="flex flex-wrap gap-2">
          {list.map((it, i) => (
            <a key={i} href={it.url || "#"} onClick={onClick}
              className="bio-card inline-flex items-center gap-1.5 min-h-[2.25rem] px-3.5 rounded-full text-xs font-bold"
              style={text}>
              {it.icon && <BioIcon name={it.icon} className="w-3.5 h-3.5" style={{ color: primaryColor }} />}
              {it.title}
            </a>
          ))}
        </div>
      </div>
    );
  }

  const round = shape === "circle";
  return (
    <div>
      <SectionTitle title={block.label} />
      {/* Horizontal scroll keeps 6+ categories usable at 320px without
          shrinking each tile below a comfortable tap target. */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {list.map((it, i) => (
          <a key={i} href={it.url || "#"} onClick={onClick}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[4.5rem]">
            <div
              className="bio-card w-14 h-14 flex items-center justify-center overflow-hidden shrink-0"
              style={{ borderRadius: round ? "9999px" : "calc(var(--bio-radius) * 0.7)" }}
            >
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              ) : (
                <BioIcon name={it.icon} className="w-6 h-6" style={{ color: primaryColor }} />
              )}
            </div>
            <span className="text-[11px] text-center leading-tight line-clamp-2" style={text}>{it.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── PRODUCT GRID ─────────────────────────────────────────────────────────────

function priceText(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return toPersianNumber(n.toLocaleString("fa-IR"));
}

export function ProductGridBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const { primaryColor, slug, products } = useBioContext();
  const source = block.data?.source || "auto";
  const cols = block.data?.columns === "3" ? "grid-cols-3" : "grid-cols-2";

  // `auto` reads the shop's real catalogue; `manual` reads rows typed into the
  // block. Templates ship in manual mode with demo rows so a brand-new page is
  // never empty, and the seller flips one select to go live.
  const list =
    source === "auto"
      ? (products || []).slice(0, Number(block.data?.limit) || 6).map((p: any) => ({
          title: p.name,
          imageUrl: Array.isArray(p.images) ? p.images[0] : undefined,
          price: p.price,
          url: `/${slug}/shop`,
        }))
      : items(block);

  if (!list.length) return null;

  return (
    <div>
      <SectionTitle
        title={block.label}
        moreLabel={block.data?.moreLabel}
        moreUrl={block.url || (source === "auto" ? `/${slug}/shop` : undefined)}
      />
      <div className={`grid ${cols} gap-2.5`}>
        {list.map((it: any, i: number) => {
          const price = priceText(it.price);
          const old = priceText(it.oldPrice);
          return (
            <a key={i} href={it.url || "#"} onClick={onClick}
              className="bio-card flex flex-col overflow-hidden active:scale-[0.98] transition-transform">
              <div className="relative w-full aspect-square overflow-hidden" style={{ background: "var(--bio-card-hover-bg)" }}>
                {it.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={it.title || ""} loading="lazy" decoding="async"
                    className="w-full h-full object-cover" />
                )}
                {it.badge && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-black text-white"
                    style={{ background: primaryColor }}>
                    {it.badge}
                  </span>
                )}
              </div>
              <div className="p-2 space-y-1">
                <p className="text-[11px] font-medium leading-tight line-clamp-2" style={text}>{it.title}</p>
                {price && (
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[11px] font-black" style={{ color: primaryColor }}>{price}</span>
                    <span className="text-[9px]" style={dim}>تومان</span>
                    {old && <span className="text-[9px] line-through" style={dim}>{old}</span>}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── GALLERY ──────────────────────────────────────────────────────────────────

const RATIOS: Record<string, string> = { square: "aspect-square", portrait: "aspect-[3/4]", landscape: "aspect-[4/3]" };

export function GalleryBlock({ block }: { block: Block }) {
  const list = items(block).filter((it) => it.imageUrl);
  if (!list.length) return null;
  const cols = block.data?.columns === "2" ? "grid-cols-2" : "grid-cols-3";
  const ratio = RATIOS[block.data?.ratio as string] || RATIOS.square;

  return (
    <div>
      <SectionTitle title={block.label} />
      <div className={`grid ${cols} gap-2`}>
        {list.map((it, i) => {
          const Wrapper: any = it.url ? "a" : "div";
          return (
            <Wrapper key={i} href={it.url || undefined}
              target={it.url ? "_blank" : undefined} rel={it.url ? "noopener noreferrer" : undefined}
              className={`block overflow-hidden ${ratio}`} style={{ borderRadius: "calc(var(--bio-radius) * 0.6)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.imageUrl} alt={it.title || ""} loading="lazy" decoding="async"
                className="w-full h-full object-cover" />
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}

// ─── TESTIMONIAL ──────────────────────────────────────────────────────────────

export function TestimonialBlock({ block }: { block: Block }) {
  const { primaryColor } = useBioContext();
  const list = items(block).filter((it) => it.text);
  if (!list.length) return null;

  return (
    <div>
      <SectionTitle title={block.label} />
      <div className="space-y-2.5">
        {list.map((it, i) => {
          const rating = Number(it.rating ?? 5);
          return (
            <div key={i} className="bio-card p-3.5 space-y-2">
              {rating > 0 && (
                <div className="flex gap-0.5" aria-label={`${toPersianNumber(rating)} از ۵`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} aria-hidden="true" className="w-3.5 h-3.5"
                      fill={s < rating ? primaryColor : "transparent"}
                      style={{ color: s < rating ? primaryColor : "var(--bio-text-secondary)" }} />
                  ))}
                </div>
              )}
              <p className="text-xs leading-relaxed" style={text}>{it.text}</p>
              {(it.name || it.avatarUrl) && (
                <div className="flex items-center gap-2 pt-1">
                  {it.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.avatarUrl} alt="" loading="lazy" decoding="async"
                      className="w-7 h-7 rounded-full object-cover shrink-0" />
                  )}
                  <div className="min-w-0">
                    {it.name && <div className="text-[11px] font-bold truncate" style={text}>{it.name}</div>}
                    {it.role && <div className="text-[10px] truncate" style={dim}>{it.role}</div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export function StatsBlock({ block }: { block: Block }) {
  const { primaryColor } = useBioContext();
  // A stat with no number is an empty box on a live page — drop it rather
  // than render a hole in the row.
  const list = items(block).filter((it) => String(it.value ?? "").trim() !== "").slice(0, 4);
  if (!list.length) return null;
  return (
    <div className={`grid gap-2 ${list.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {list.map((it, i) => (
        <div key={i} className="bio-card flex flex-col items-center gap-0.5 px-2 py-3 text-center">
          {it.icon && <BioIcon name={it.icon} className="w-4 h-4 mb-0.5" style={{ color: primaryColor }} />}
          <span className="text-lg font-black tabular-nums" style={{ color: primaryColor }}>{it.value}</span>
          <span className="text-[10px] leading-tight" style={dim}>{it.title}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SOCIAL ROW ───────────────────────────────────────────────────────────────

function socialHref(platform: string, raw: string) {
  const v = (raw || "").trim().replace(/^@/, "");
  if (/^https?:\/\//.test(v)) return v;
  const prefix = PLATFORM_META[platform]?.prefix;
  if (prefix) return `${prefix}${v}`;
  if (platform === "instagram") return `https://instagram.com/${v}`;
  if (platform === "youtube") return `https://youtube.com/${v}`;
  if (platform === "aparat") return `https://aparat.com/${v}`;
  return v;
}

export function SocialRowBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const list = items(block).filter((it) => it.platform);
  if (!list.length) return null;
  const labeled = block.data?.style === "labeled";

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {list.map((it, i) => (
        <a key={i} href={socialHref(it.platform, it.url)} target="_blank" rel="noopener noreferrer"
          onClick={onClick}
          aria-label={PLATFORM_META[it.platform]?.label || it.platform}
          className={labeled
            ? "bio-card flex flex-col items-center gap-1 w-[4.25rem] py-2.5"
            : "bio-card flex items-center justify-center w-12 h-12 shrink-0"}
          style={labeled ? undefined : { borderRadius: "calc(var(--bio-radius) * 0.7)" }}>
          <BrandLogo platform={it.platform} size={labeled ? 24 : 26} />
          {labeled && (
            <span className="text-[10px] leading-tight" style={dim}>
              {PLATFORM_META[it.platform]?.label || it.platform}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

// ─── HOURS ────────────────────────────────────────────────────────────────────

export function HoursBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const { primaryColor } = useBioContext();
  const list = items(block);
  const hasBody = list.length > 0 || block.data?.address;
  if (!hasBody) return null;

  return (
    <div className="bio-card p-4 space-y-3">
      {block.label && (
        <h2 className="flex items-center gap-1.5 text-sm font-bold" style={text}>
          <BioIcon name="clock" className="w-4 h-4" style={{ color: primaryColor }} />
          {block.label}
        </h2>
      )}
      {list.length > 0 && (
        <dl className="space-y-1.5">
          {list.map((it, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 text-xs">
              <dt style={dim}>{it.title}</dt>
              <dd className="font-bold tabular-nums" style={text}>{it.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {block.data?.address && (
        <div className="flex items-start gap-2 pt-2 border-t text-xs leading-relaxed"
          style={{ borderColor: "var(--bio-card-border)" }}>
          <MapPin aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
          <span className="flex-1" style={dim}>{block.data.address}</span>
        </div>
      )}
      {block.url && (
        <a href={block.url} target="_blank" rel="noopener noreferrer" onClick={onClick}
          className="flex items-center justify-center min-h-[2.75rem] rounded-xl text-xs font-bold"
          style={{ background: `${primaryColor}1a`, color: primaryColor }}>
          مشاهده روی نقشه
        </a>
      )}
    </div>
  );
}

// ─── PRICE LIST ───────────────────────────────────────────────────────────────

export function PriceListBlock({ block }: { block: Block }) {
  const { primaryColor } = useBioContext();
  const list = items(block).filter((it) => it.title);
  if (!list.length) return null;

  return (
    <div className="bio-card p-4 space-y-3">
      {block.label && <h2 className="text-sm font-bold" style={text}>{block.label}</h2>}
      <ul className="space-y-2.5">
        {list.map((it, i) => (
          <li key={i} className="flex items-start justify-between gap-3 pb-2.5 border-b last:border-0 last:pb-0"
            style={{ borderColor: "var(--bio-card-border)" }}>
            <div className="min-w-0">
              <div className="text-xs font-medium" style={text}>{it.title}</div>
              {it.subtitle && <div className="text-[10px] mt-0.5" style={dim}>{it.subtitle}</div>}
            </div>
            {it.value && (
              <span className="text-xs font-black shrink-0 tabular-nums" style={{ color: primaryColor }}>
                {it.value}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── BUTTON ROW ───────────────────────────────────────────────────────────────

export function ButtonRowBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const { primaryColor } = useBioContext();
  const secondaryLabel = block.data?.secondaryLabel;
  const secondaryUrl = block.data?.secondaryUrl;

  return (
    <div className="flex gap-2.5">
      <a href={block.url || "#"} onClick={onClick}
        className="flex-1 flex items-center justify-center gap-2 min-h-[3rem] px-4
                   text-sm font-bold text-white active:scale-[0.98] transition-transform"
        style={{ background: primaryColor, boxShadow: `0 4px 18px ${primaryColor}40`, ...radius }}>
        {block.data?.primaryIcon && <BioIcon name={block.data.primaryIcon} className="w-4 h-4" />}
        {block.label}
      </a>
      {secondaryLabel && secondaryUrl && (
        <a href={secondaryUrl} onClick={onClick}
          className="bio-card flex-1 flex items-center justify-center gap-2 min-h-[3rem] px-4
                     text-sm font-bold active:scale-[0.98] transition-transform"
          style={text}>
          {block.data?.secondaryIcon && (
            <BioIcon name={block.data.secondaryIcon} className="w-4 h-4" style={{ color: primaryColor }} />
          )}
          {secondaryLabel}
        </a>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

/**
 * Rendered in place inside the block list (not `position: fixed`) so it can
 * never cover the page's own content or the Weelink badge, and so the live
 * editor preview shows it exactly where the visitor will see it. The
 * reference designs put it at the end of the page, which is where sellers
 * naturally order it anyway.
 */
export function BottomNavBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const { primaryColor } = useBioContext();
  const list = items(block).slice(0, 5);
  if (!list.length) return null;

  return (
    <nav className="bio-card flex items-stretch justify-around px-1 py-1.5">
      {list.map((it, i) => (
        <a key={i} href={it.url || "#"} onClick={onClick}
          className="flex flex-col items-center justify-center gap-1 flex-1 min-h-[2.75rem] px-1 rounded-xl">
          <BioIcon name={it.icon} className="w-5 h-5" style={{ color: i === 0 ? primaryColor : undefined, ...(i === 0 ? {} : dim) }} />
          <span className="text-[10px] leading-none truncate max-w-full"
            style={i === 0 ? { color: primaryColor } : dim}>
            {it.title}
          </span>
        </a>
      ))}
    </nav>
  );
}
