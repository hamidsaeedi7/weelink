"use client";

import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { ExternalLink } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bgImageUrl?: string;
  primaryColor?: string;
  fontFamily?: string;
  themeId?: string;
  blocks: any[];
}

export function BioPageClient({ shop }: { shop: Shop }) {
  const primary = shop.primaryColor || "#F97316";
  const bg = shop.bgImageUrl;

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        background: bg
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bg}) center/cover no-repeat`
          : `linear-gradient(160deg, #0A0A0F 0%, #111122 100%)`,
        fontFamily: shop.fontFamily === "Vazirmatn" ? "Vazirmatn, sans-serif" : shop.fontFamily,
      }}
    >
      {/* Banner */}
      {shop.bannerUrl && (
        <div className="w-full max-w-lg h-36 relative overflow-hidden">
          <img src={shop.bannerUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="w-full max-w-lg px-4 pb-16">
        {/* Profile */}
        <div className="flex flex-col items-center pt-10 pb-6 space-y-3">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full overflow-hidden border-2 shadow-xl"
            style={{ borderColor: `${primary}60`, boxShadow: `0 0 25px ${primary}30` }}
          >
            {shop.avatarUrl ? (
              <img src={shop.avatarUrl} alt={shop.name} className="w-full h-full object-cover" />
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
          <h1 className="text-xl font-black text-white">{shop.name}</h1>

          {/* Bio */}
          {shop.bio && (
            <p className="text-sm text-white/60 text-center max-w-xs leading-relaxed">
              {shop.bio}
            </p>
          )}
        </div>

        {/* Blocks */}
        <div className="space-y-2.5">
          {shop.blocks.map((block: any) => (
            <BlockRenderer key={block.id} block={block} primaryColor={primary} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-10 text-xs text-white/20">
          <span>ساخته شده با</span>
          <a
            href="https://weeelink.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-orange-400 transition-colors font-bold flex items-center gap-1"
          >
            ویلینک
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
