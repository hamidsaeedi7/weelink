"use client";

import { useState } from "react";
import { FileDown, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PurchaseModal } from "@/components/PurchaseModal";

interface DFile { id: string; title: string; description?: string; coverUrl?: string; price: string; isFree: boolean; }

export default function FilesClient({ slug, files, shop }: { slug: string; files: DFile[]; shop: any }) {
  const [buy, setBuy] = useState<DFile | null>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="relative text-center">
          <a href={`/${slug}`} title="بازگشت به فروشگاه"
            className="absolute right-0 top-0 p-2 rounded-xl bg-white/5 border border-white/10 text-white/60
                       hover:text-orange-500 hover:border-orange-500/40 transition-all">
            <ArrowRight className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-black flex items-center justify-center gap-2"><FileDown className="w-5 h-5 text-orange-500" /> فایل‌های دیجیتال</h1>
          {shop?.name && <p className="text-sm text-white/50 mt-1">{shop.name}</p>}
        </div>

        {files.length === 0 ? (
          <p className="text-center text-white/40 py-16">فایلی برای فروش موجود نیست</p>
        ) : (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                {f.coverUrl && <img src={f.coverUrl} alt={f.title} className="w-full h-40 object-cover" />}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold">{f.title}</h3>
                  {f.description && <p className="text-xs text-white/50 line-clamp-2">{f.description}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-orange-500">{f.isFree ? "رایگان" : formatPrice(Number(f.price))}</span>
                    <button onClick={() => setBuy(f)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-bold transition-all">
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
        <PurchaseModal item={buy} shop={shop} onClose={() => setBuy(null)} />
      )}
    </div>
  );
}
