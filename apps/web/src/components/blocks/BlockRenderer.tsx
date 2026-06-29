"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Phone, MapPin, ChevronDown, Mail } from "lucide-react";
import { blocksApi } from "@/lib/api";
import { MESSENGER_META } from "./block-types";
import Image from "next/image";

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

export function BlockRenderer({ block, primaryColor = "#F97316" }: Props) {
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
      return <EmailCaptureBlock block={block} />;
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
    default:
      return null;
  }
}

// ─── Link ─────────────────────────────────────────────────────────────────────

function LinkBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <a href={block.url || "#"} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl
                 bg-white/5 border border-white/8 hover:border-white/20
                 hover:bg-white/8 transition-all duration-200 group active:scale-[0.98]">
      {block.icon && <span className="text-xl shrink-0">{block.icon}</span>}
      <span className="flex-1 text-sm font-medium text-white text-center">{block.label}</span>
      <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
    </a>
  );
}

// ─── Featured ─────────────────────────────────────────────────────────────────

function FeaturedBlock({ block, color, onClick }: { block: Block; color: string; onClick: () => void }) {
  return (
    <a href={block.url || "#"} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      style={{ background: `${color}20`, borderColor: `${color}40` }}
      className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl border
                 hover:opacity-90 transition-all duration-200 active:scale-[0.98]">
      {block.icon && <span className="text-2xl shrink-0">{block.icon}</span>}
      <span className="flex-1 text-sm font-bold text-white text-center">{block.label}</span>
      <ExternalLink className="w-4 h-4 text-white/40 shrink-0" />
    </a>
  );
}

// ─── Messenger ────────────────────────────────────────────────────────────────

function MessengerBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  const platform = block.data?.platform || "telegram";
  const meta = MESSENGER_META[platform] || MESSENGER_META.telegram;
  const href = block.url?.startsWith("http") ? block.url : `${meta.prefix}${block.url}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      style={{ borderColor: `${meta.color}30` }}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl
                 bg-white/5 border hover:bg-white/10
                 transition-all duration-200 active:scale-[0.98]">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${meta.color}20` }}>
        <span className="text-base">💬</span>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{block.label || meta.label}</div>
        <div className="text-xs text-white/40">{meta.label}</div>
      </div>
    </a>
  );
}

// ─── Phone ────────────────────────────────────────────────────────────────────

function PhoneBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <a href={`tel:${block.url}`} onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl
                 bg-green-500/10 border border-green-500/20 hover:bg-green-500/15
                 transition-all duration-200 active:scale-[0.98]">
      <Phone className="w-5 h-5 text-green-400 shrink-0" />
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{block.label || "تماس با ما"}</div>
        <div className="text-xs text-white/40 font-mono" dir="ltr">{block.url}</div>
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
      className="block w-full rounded-2xl overflow-hidden">
      <img src={imageUrl} alt={block.label || ""} className="w-full h-auto object-cover" />
    </Wrapper>
  );
}

// ─── Text ─────────────────────────────────────────────────────────────────────

function TextBlock({ block }: { block: Block }) {
  return (
    <div className="w-full px-4 py-3 text-sm text-white/70 leading-relaxed text-center">
      {block.data?.content}
    </div>
  );
}

// ─── Video ────────────────────────────────────────────────────────────────────

function VideoBlock({ block }: { block: Block }) {
  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === "youtube") {
      const id = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (platform === "aparat") {
      const id = url.match(/\/v\/([^/]+)/)?.[1];
      return id ? `https://www.aparat.com/video/video/embed/videohash/${id}/vt/frame` : null;
    }
    return null;
  };

  const embed = getEmbedUrl(block.url || "", block.data?.platform || "youtube");
  if (!embed) return null;

  return (
    <div className="w-full rounded-2xl overflow-hidden aspect-video bg-black/40">
      <iframe src={embed} className="w-full h-full" allowFullScreen title={block.label} />
    </div>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

function MapBlock({ block, onClick }: { block: Block; onClick: () => void }) {
  return (
    <a href={block.url || "#"} target="_blank" rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl
                 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15
                 transition-all duration-200 active:scale-[0.98]">
      <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
      <span className="flex-1 text-sm font-medium text-white">{block.label}</span>
      <ExternalLink className="w-4 h-4 text-white/30 shrink-0" />
    </a>
  );
}

// ─── Email Capture ────────────────────────────────────────────────────────────

function EmailCaptureBlock({ block }: { block: Block }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Mail className="w-4 h-4 text-orange-400" />
        {block.label || "عضویت در خبرنامه"}
      </div>
      {done ? (
        <p className="text-xs text-green-400 text-center py-2">ثبت شد! ممنون 🎉</p>
      ) : (
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={block.data?.placeholder || "ایمیل شما"}
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                       text-white text-sm placeholder:text-white/30 focus:outline-none
                       focus:border-orange-500/50 text-left"
            dir="ltr"
          />
          <button onClick={() => email && setDone(true)}
            className="px-4 py-2 bg-orange-500 text-white text-sm rounded-xl hover:bg-orange-400 transition-colors">
            ثبت
          </button>
        </div>
      )}
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqBlock({ block }: { block: Block }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium text-white">
        <span>{block.label}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">
          {block.data?.answer}
        </div>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function DividerBlock({ block }: { block: Block }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-white/10" />
      {block.label && <span className="text-xs text-white/30 shrink-0">{block.label}</span>}
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

// ─── Group ────────────────────────────────────────────────────────────────────

function GroupBlock({ block }: { block: Block }) {
  return (
    <div className="text-xs font-bold text-white/40 uppercase tracking-widest py-1 text-center">
      {block.label}
    </div>
  );
}

// ─── Order Form Block ──────────────────────────────────────────────────────────

function OrderFormBlock({ block, color, onClick }: { block: Block; color: string; onClick: () => void }) {
  const slug = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "";
  return (
    <a
      href={`/${slug}/order`}
      onClick={onClick}
      className="flex items-center justify-center gap-3 w-full px-4 py-4 rounded-2xl
                 font-bold text-white text-sm active:scale-[0.98] transition-all duration-200"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 20px ${color}40` }}
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
      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl
                 bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366]/60
                 hover:bg-[#25D366]/15 transition-all duration-200 active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" fill="#25D366" className="w-6 h-6 shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
      <span className="flex-1 text-sm font-medium text-white text-center">
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
  }, []);

  if (timeLeft.expired) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="w-full px-4 py-4 rounded-2xl border border-red-500/30 text-center space-y-2"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))" }}
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">⚡</span>
        <span className="text-sm font-bold text-white">{title}</span>
        {discount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white">
            {discount}٪ تخفیف
          </span>
        )}
      </div>
      {endDate && (
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-mono">
          <span className="px-2 py-1 rounded-lg bg-white/10 font-black">{pad(timeLeft.h)}</span>
          <span className="text-white/40">:</span>
          <span className="px-2 py-1 rounded-lg bg-white/10 font-black">{pad(timeLeft.m)}</span>
          <span className="text-white/40">:</span>
          <span className="px-2 py-1 rounded-lg bg-white/10 font-black">{pad(timeLeft.s)}</span>
        </div>
      )}
      {block.data?.description && (
        <p className="text-xs text-white/50">{block.data.description}</p>
      )}
    </div>
  );
}

