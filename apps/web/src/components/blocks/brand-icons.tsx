import React from "react";

// Brand logos for messenger / video platforms. Global brands use their official
// single-color marks; Iranian apps (بله/روبیکا/ایتا/آپارات) use clean branded
// tiles with their name, since their real logos are not simple single paths.

export interface BrandMeta {
  label: string;
  color: string;
  /** prefix used to build a link from a username/number for messenger blocks */
  prefix?: string;
}

export const PLATFORM_META: Record<string, BrandMeta> = {
  whatsapp: { label: "واتساپ", color: "#25D366", prefix: "https://wa.me/" },
  telegram: { label: "تلگرام", color: "#229ED9", prefix: "https://t.me/" },
  bale: { label: "بله", color: "#1BA0C7", prefix: "https://ble.ir/" },
  rubika: { label: "روبیکا", color: "#7C3AED", prefix: "https://rubika.ir/" },
  eitaa: { label: "ایتا", color: "#F5820D", prefix: "https://eitaa.com/" },
  instagram: { label: "اینستاگرام", color: "#E1306C" },
  youtube: { label: "یوتیوب", color: "#FF0000" },
  aparat: { label: "آپارات", color: "#ED145B" },
};

function Tile({ text, color, size }: { text: string; color: string; size: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg font-black text-white leading-none"
      style={{ background: color, width: size, height: size, fontSize: size * 0.34 }}
    >
      {text}
    </span>
  );
}

export function BrandLogo({
  platform,
  size = 28,
  className = "",
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const s = { width: size, height: size };
  switch (platform) {
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" style={s} className={className} fill="#25D366" aria-label="WhatsApp">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
        </svg>
      );
    case "telegram":
      return (
        <svg viewBox="0 0 24 24" style={s} className={className} fill="#229ED9" aria-label="Telegram">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" style={s} className={className} aria-label="Instagram">
          <defs>
            <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FEDA75" />
              <stop offset="0.35" stopColor="#FA7E1E" />
              <stop offset="0.6" stopColor="#D62976" />
              <stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <path fill="url(#ig-grad)" d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38zm6.99-11.4a1.58 1.58 0 1 1-1.58-1.57 1.58 1.58 0 0 1 1.58 1.57z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" style={s} className={className} fill="#FF0000" aria-label="YouTube">
          <path d="M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "aparat":
      return <Tile text="آپ" color={PLATFORM_META.aparat.color} size={size} />;
    case "bale":
      return <Tile text="بله" color={PLATFORM_META.bale.color} size={size} />;
    case "rubika":
      return <Tile text="R" color={PLATFORM_META.rubika.color} size={size} />;
    case "eitaa":
      return <Tile text="ایتا" color={PLATFORM_META.eitaa.color} size={size} />;
    default:
      return <Tile text="●" color="#888" size={size} />;
  }
}
