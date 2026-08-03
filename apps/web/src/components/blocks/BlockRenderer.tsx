"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Phone, MapPin, ChevronDown, Mail } from "lucide-react";
import { blocksApi, audienceApi } from "@/lib/api";
import { MESSENGER_META } from "./block-types";
import { BrandLogo, PLATFORM_META } from "./brand-icons";
import {
  HeroBlock, TrustBarBlock, CategoryChipsBlock, ProductGridBlock, GalleryBlock,
  TestimonialBlock, StatsBlock, SocialRowBlock, HoursBlock, PriceListBlock,
  ButtonRowBlock, BottomNavBlock, useBioContext,
} from "./SiteBlocks";

interface Block {
  id: string;
  type: string;
  label?: string;
  url?: string;
  icon?: string;
  data?: Record<string, any>;
  isFeatured?: boolean;
}

interface Props {
  block: Block;
  primaryColor?: string;
}

const textStyle = { color: "var(--bio-text)" };
const secondaryStyle = { color: "var(--bio-text-secondary)" };
const radiusStyle = { borderRadius: "var(--bio-radius)" };
// Inset surfaces (countdown chips, inputs) must follow the seller's chosen
// bio mode. Tailwind's `dark:` variant would follow the VISITOR's site theme
// instead, so a light bio page opened in a dark browser theme got dark chips.
const chipStyle = { background: "var(--bio-card-hover-bg)" };

export function BlockRenderer({ block, primaryColor = "#0EA88A" }: Props) {
  const handleClick = () => {
    blocksApi.click(block.id).catch(() => {});
  };

  switch (block.type) {
    case "LINK":
      return <LinkBlock block={block} onClick={handleClick} />;
    case "FEATURED":
      return <FeaturedBlock block={block} color={primaryColor} onClick={handleClick} />;
    case "MESSENGER":
      return <MessengerBlock block={block} onClick={handleClick} />;
    case "PHONE":
      return <PhoneBlock block={block} onClick={handleClick} />;
    case "IMAGE":
      return <ImageBlock block={block} onClick={handleClick} />;
    case "TEXT":
      return <TextBlock block={block} />;
    case "VIDEO":
      return <VideoBlock block={block} />;
    case "MAP":
      return <MapBlock block={block} onClick={handleClick} />;
    case "EMAIL_CAPTURE":
      return <EmailCaptureBlock block={block} color={primaryColor} />;
    case "FAQ":
      return <FaqBlock block={block} />;
    case "DIVIDER":
      return <DividerBlock block={block} />;
    case "GROUP":
      return <GroupBlock block={block} />;
    case "ORDER_FORM":
      return <OrderFormBlock block={block} color={primaryColor} onClick={handleClick} />;
    case "FLASH_SALE":
      return <FlashSaleBlock block={block} color={primaryColor} />;
    case "WHATSAPP":
      return <WhatsAppBlock block={block} onClick={handleClick} />;

    // ─ mini-site blocks (see SiteBlocks.tsx) ─
    case "HERO":
      return <HeroBlock block={block} onClick={handleClick} />;
    case "TRUST_BAR":
      return <TrustBarBlock block={block} />;
    case "CATEGORY_CHIPS":
      return <CategoryChipsBlock block={block} onClick={handleClick} />;
    case "PRODUCT_GRID":
      return <ProductGridBlock block={block} onClick={handleClick} />;
    case "GALLERY":
      return <GalleryBlock block={block} />;
    case "TESTIMONIAL":
      return <TestimonialBlock block={block} />;
    case "STATS":
      return <StatsBlock block={block} />;
    case "SOCIAL_ROW":
      return <SocialRowBlock block={block} onClick={handleClick} />;
    case "HOURS":
      return <HoursBlock block={block} onClick={handleClick} />;
    case "PRICE_LIST":
      return <PriceListBlock block={block} />;
    case "BUTTON_ROW":
      return <ButtonRowBlock block={block} onClick={handleClick} />;
    case "BOTTOM_NAV":
      return <BottomNavBlock block={block} onClick={handleClick} />;

    default:
      return null;
  }
}

// ─── Link ─────────────────────────────────────────────────────────────────────

function LinkBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <a href={block.url || "#"} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      className="bio-card flex items-center gap-3 w-full px-4 py-3.5
                 transition-all duration-200 group active:scale-[0.98]">
      {block.icon && <span className="text-xl shrink-0">{block.icon}</span>}
      <span className="flex-1 text-sm font-medium text-center" style={textStyle}>{block.label}</span>
      <ExternalLink className="w-4 h-4 shrink-0 transition-colors" style={secondaryStyle} />
    </a>
  );
}

// ─── Featured ─────────────────────────────────────────────────────────────────

function FeaturedBlock({ block, color, onClick }: { block: Block; color: string; onClick: () => void }) {
  return (
    <a href={block.url || "#"} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      style={{ background: `${color}20`, borderColor: `${color}40`, ...radiusStyle, ...textStyle }}
      className="flex items-center gap-3 w-full px-4 py-4 border
                 hover:opacity-90 transition-all duration-200 active:scale-[0.98]">
      {block.icon && <span className="text-2xl shrink-0">{block.icon}</span>}
      <span className="flex-1 text-sm font-bold text-center">{block.label}</span>
      <ExternalLink className="w-4 h-4 shrink-0" style={secondaryStyle} />
    </a>
  );
}

// ─── Messenger ────────────────────────────────────────────────────────────────

function MessengerBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const platform = block.data?.platform || "telegram";
  const meta = PLATFORM_META[platform] || MESSENGER_META[platform] || PLATFORM_META.telegram;
  const prefix = (meta as any).prefix || "";
  const raw = (block.url || "").replace(/^@/, "");
  const href = raw.startsWith("http") ? raw : `${prefix}${raw}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      style={{ ...radiusStyle, borderColor: `${meta.color}30` }}
      className="bio-card flex items-center gap-3 w-full px-4 py-3.5 border
                 transition-all duration-200 active:scale-[0.98]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${meta.color}20` }}>
        <BrandLogo platform={platform} size={22} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium" style={textStyle}>{block.label || meta.label}</div>
        <div className="text-xs" style={secondaryStyle}>{meta.label}</div>
      </div>
    </a>
  );
}

// ─── Phone ────────────────────────────────────────────────────────────────────

function PhoneBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <a href={`tel:${block.url}`} onClick={onClick}
      style={radiusStyle}
      className="flex items-center gap-3 w-full px-4 py-3.5
                 bg-green-500/10 border border-green-500/20 hover:bg-green-500/15
                 transition-all duration-200 active:scale-[0.98]">
      <Phone className="w-5 h-5 text-green-400 shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-medium" style={textStyle}>{block.label || "تماس با ما"}</div>
        <div className="text-xs font-mono" style={secondaryStyle} dir="ltr">{block.url}</div>
      </div>
    </a>
  );
}

// ─── Image ────────────────────────────────────────────────────────────────────

function ImageBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const imageUrl = block.data?.imageUrl;
  if (!imageUrl) return null;
  const Wrapper = block.url ? "a" : "div";
  return (
    <Wrapper href={block.url} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      style={radiusStyle}
      className="block w-full overflow-hidden">
      <img src={imageUrl} alt={block.label || ""} className="w-full h-auto object-cover" />
    </Wrapper>
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────

function TextBlock({ block }: { block: Block }) {
  return (
    <div className="w-full px-4 py-3 text-sm leading-relaxed text-center" style={secondaryStyle}>
      {block.data?.content}
    </div>
  );
}

// ─── Video ────────────────────────────────────────────────────────────────────

function VideoBlock({ block }: { block: Block }) {
  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === "youtube") {
      const id = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([^&?/]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (platform === "aparat") {
      const id = url.match(/\/v\/([^/?]+)/)?.[1];
      return id ? `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame` : null;
    }
    if (platform === "instagram") {
      const id = url.match(/\/(?:reel|p|tv)\/([^/?]+)/)?.[1];
      return id ? `https://www.instagram.com/p/${id}/embed` : null;
    }
    return null;
  };

  const platform = block.data?.platform || "youtube";
  const embed = getEmbedUrl(block.url || "", platform);

  // If we can't embed (e.g. a private/unsupported link), fall back to a branded
  // link card so the block is never silently blank.
  if (!embed) {
    if (!block.url) return null;
    const meta = PLATFORM_META[platform];
    return (
      <a href={block.url} target="_blank" rel="noopener noreferrer"
        style={radiusStyle}
        className="bio-card flex items-center gap-3 w-full px-4 py-3.5
                   transition-all active:scale-[0.98]">
        <BrandLogo platform={platform} size={26} />
        <span className="flex-1 text-sm font-medium" style={textStyle}>{block.label || meta?.label || "مشاهده ویدیو"}</span>
        <ExternalLink className="w-4 h-4 shrink-0" style={secondaryStyle} />
      </a>
    );
  }

  return (
    <div style={radiusStyle} className={`w-full overflow-hidden bg-black/40 ${platform === "instagram" ? "aspect-[4/5]" : "aspect-video"}`}>
      <iframe src={embed} className="w-full h-full" allowFullScreen title={block.label} />
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function MapBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <a href={block.url || "#"} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      style={radiusStyle}
      className="flex items-center gap-3 w-full px-4 py-3.5
                 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15
                 transition-all duration-200 active:scale-[0.98]">
      <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
      <span className="flex-1 text-sm font-medium" style={textStyle}>{block.label}</span>
      <ExternalLink className="w-4 h-4 shrink-0" style={secondaryStyle} />
    </a>
  );
}

// ─── Email Capture ────────────────────────────────────────────────────────────

function EmailCaptureBlock({ block, color }: { block: Block; color: string }) {
  const { slug } = useBioContext();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  // This used to just flip a boolean and throw the address away, so every
  // newsletter signup on every seller page was silently lost. It now posts to
  // the same audience endpoint the dashboard's "مخاطبان" list reads.
  const submit = async () => {
    if (!email.trim() || state === "sending") return;
    setState("sending");
    try {
      await audienceApi.subscribe(slug, { email: email.trim(), source: "BIO_PAGE" });
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="bio-card w-full p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium" style={textStyle}>
        <Mail aria-hidden="true" className="w-4 h-4" style={{ color }} />
        {block.label || "عضویت در خبرنامه"}
      </div>
      {state === "done" ? (
        <p className="text-xs text-center py-2" style={{ color }} role="status">ثبت شد! ممنون 🎉</p>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={block.data?.placeholder || "ایمیل شما"}
              aria-label={block.label || "ایمیل شما"}
              style={{ ...textStyle, ...chipStyle, borderRadius: "calc(var(--bio-radius) * 0.7)" }}
              className="flex-1 px-3 py-2 border border-current/10
                         text-sm placeholder:opacity-40 focus:outline-none text-left"
              dir="ltr"
            />
            <button onClick={submit} disabled={state === "sending"}
              style={{ borderRadius: "calc(var(--bio-radius) * 0.7)", background: color }}
              className="px-4 min-h-[2.75rem] text-white text-sm font-bold disabled:opacity-60 transition-opacity">
              {state === "sending" ? "..." : "ثبت"}
            </button>
          </div>
          {state === "error" && (
            <p className="text-xs text-red-400" role="alert">ثبت نشد — ایمیل را بررسی کن و دوباره تلاش کن.</p>
          )}
        </>
      )}
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqBlock({ block }: { block: Block }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bio-card w-full overflow-hidden">
      <button onClick={() => setOpen(!open)}
        style={textStyle}
        className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium">
        <span>{block.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={secondaryStyle} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed border-t pt-3" style={{ ...secondaryStyle, borderColor: "var(--bio-card-border)" }}>
          {block.data?.answer}
        </div>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function DividerBlock({ block }: { block: Block }) {
  const style = block.data?.style || "solid";

  const lineFor = (side: "l" | "r") => {
    switch (style) {
      case "dashed":
        return <div className="flex-1 border-t border-dashed" style={{ borderColor: "var(--bio-card-border)" }} />;
      case "dotted":
        return <div className="flex-1 border-t border-dotted" style={{ borderColor: "var(--bio-card-border)" }} />;
      case "double":
        return <div className="flex-1 border-t-[3px] border-double" style={{ borderColor: "var(--bio-card-border)" }} />;
      case "gradient":
        return (
          <div
            className="flex-1 h-px"
            style={{
              background:
                side === "l"
                  ? "linear-gradient(to right, transparent, var(--bio-card-border))"
                  : "linear-gradient(to left, transparent, var(--bio-card-border))",
            }}
          />
        );
      default:
        return <div className="flex-1 h-px" style={{ background: "var(--bio-card-border)" }} />;
    }
  };

  return (
    <div className="flex items-center gap-3 py-1">
      {lineFor("l")}
      {block.label && <span className="text-xs shrink-0" style={secondaryStyle}>{block.label}</span>}
      {lineFor("r")}
    </div>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────────

function GroupBlock({ block }: { block: Block }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest py-1 text-center" style={secondaryStyle}>
      {block.label}
    </div>
  );
}

// ─── Order Form Block ──────────────────────────────────────────────────────────

function OrderFormBlock({ block, color, onClick }: { block: Block; color: string; onClick: () => void }) {
  // Destination link is set by the user; fall back to the built-in order page.
  // The slug comes from context rather than window.location — the latter was
  // empty during SSR (so the fallback rendered as "//order") and pointed at
  // the wrong path entirely on a custom domain or inside the editor preview.
  const { slug } = useBioContext();
  const href = block.url && block.url.trim() !== "" ? block.url : `/${slug}/order`;
  const external = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center justify-center gap-3 w-full px-4 py-4
                 font-bold text-white text-sm active:scale-[0.98] transition-all duration-200"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 20px ${color}40`, ...radiusStyle }}
    >
      <span className="text-lg">🛒</span>
      {block.label || "ثبت سفارش آنلاین"}
    </a>
  );
}

// ─── WhatsApp Smart Block ──────────────────────────────────────────────────────

function WhatsAppBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const phone = block.data?.phone || block.url || "";
  const msg = block.data?.message || "سلام، می‌خوام سفارش بدم";
  const href = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      style={radiusStyle}
      className="flex items-center gap-3 w-full px-4 py-3.5
                 bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366]/60
                 hover:bg-[#25D366]/15 transition-all duration-200 active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" fill="#25D366" className="w-6 h-6 shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
      <span className="flex-1 text-sm font-medium text-center" style={textStyle}>
        {block.label || "پیام در واتساپ"}
      </span>
    </a>
  );
}

// ─── Flash Sale Block ──────────────────────────────────────────────────────────

function FlashSaleBlock({ block, color }: { block: Block; color: string }) {
  const endDate = block.data?.endDate ? new Date(block.data.endDate) : null;
  const discount = block.data?.discount || 0;
  const title = block.label || "فروش ویژه";

  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0, expired: true }); return; }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // Re-arm when the seller edits the end date — without this the countdown
    // kept ticking against the value captured on first mount, which made the
    // live editor show a stale timer.
  }, [block.data?.endDate]);

  if (timeLeft.expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="w-full px-4 py-4 border border-red-500/30 text-center space-y-2"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))", ...radiusStyle }}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">⚡</span>
        <span className="text-sm font-bold" style={textStyle}>{title}</span>
        {discount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white">
            {discount}٪ تخفیف
          </span>
        )}
      </div>
      {endDate && (
        <div className="flex items-center justify-center gap-2 text-sm font-mono" style={textStyle}>
          <span className="px-2 py-1 rounded-lg font-black" style={chipStyle}>{pad(timeLeft.h)}</span>
          <span style={secondaryStyle}>:</span>
          <span className="px-2 py-1 rounded-lg font-black" style={chipStyle}>{pad(timeLeft.m)}</span>
          <span style={secondaryStyle}>:</span>
          <span className="px-2 py-1 rounded-lg font-black" style={chipStyle}>{pad(timeLeft.s)}</span>
        </div>
      )}
      {block.data?.description && (
        <p className="text-xs" style={secondaryStyle}>{block.data.description}</p>
      )}
    </div>
  );
}
