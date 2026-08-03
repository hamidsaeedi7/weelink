"use client";

import { useState } from "react";
import { FileDown, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PurchaseModal } from "@/components/PurchaseModal";
import { resolveBioBackground } from "@/lib/bio-theme";

interface DFile { id: string; title: string; description?: string; coverUrl?: string; price: string; isFree: boolean; }

const textStyle = { color: "var(--bio-text)" };
const secondaryStyle = { color: "var(--bio-text-secondary)" };

export default function FilesClient({ slug, files, shop }: { slug: string; files: DFile[]; shop: any }) {
  const [buy, setBuy] = useState<DFile | null>(null);

  const primary = shop?.primaryColor || "#0EA88A";
  const theme = shop?.bioTheme || "modern";
  const mode = shop?.bioMode || "dark";
  const background = resolveBioBackground(shop, theme);

  return (
    <div
      data-bio-theme={theme}
      data-bio-mode={mode}
      className="min-h-screen py-8 px-4"
      style={{ background, fontFamily: `'${shop?.fontFamily || "Vazirmatn"}', Vazirmatn, sans-serif` }}>
      <div className="max-w-lg mx-auto space-y-5">
        <div className="relative text-center">
          <a href={`/${slug}`} title="بازگشت به فروشگاه"
            className="bio-card absolute right-0 top-0 p-2 transition-all"
            style={secondaryStyle}>
            <ArrowRight className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-black flex items-center justify-center gap-2" style={textStyle}>
            <FileDown className="w-5 h-5" style={{ color: primary }} /> فایل‌های دیجیتال
          </h1>
          {shop?.name && <p className="text-sm mt-1" style={secondaryStyle}>{shop.name}</p>}
        </div>

        {files.length === 0 ? (
          <p className="text-center py-16" style={secondaryStyle}>فایلی برای فروش موجود نیست</p>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="bio-card overflow-hidden">
                {f.coverUrl && <img src={f.coverUrl} alt={f.title} className="w-full h-40 object-cover" />}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold" style={textStyle}>{f.title}</h3>
                  {f.description && <p className="text-xs line-clamp-2" style={secondaryStyle}>{f.description}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black" style={{ color: primary }}>{f.isFree ? "رایگان" : formatPrice(Number(f.price))}</span>
                    <button onClick={() => setBuy(f)}
                      className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all"
                      style={{ background: primary }}>
                      {f.isFree ? "دریافت" : "خرید"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {buy && (
        <PurchaseModal item={buy} shop={shop} onClose={() => setBuy(null)} primary={primary} />
      )}
    </div>
  );
}
