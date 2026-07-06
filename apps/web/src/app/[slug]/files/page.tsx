"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileDown, Loader2, CreditCard, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DFile { id: string; title: string; description?: string; coverUrl?: string; price: string; isFree: boolean; }

export default function PublicFilesPage() {
  const slug = useParams().slug as string;
  const [files, setFiles] = useState<DFile[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buy, setBuy] = useState<DFile | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/digital-files`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/api/v1/shops/${slug}`).then((r) => r.json()).catch(() => null),
    ]).then(([f, s]) => {
      setFiles((f?.data ?? f ?? []) as DFile[]);
      setShop(s?.data ?? s);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
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

// مودال خرید: پرداخت کارت‌به‌کارت (شماره کارت + مبلغ قابل کپی)
export function PurchaseModal({ item, shop, onClose }: { item: any; shop: any; onClose: () => void }) {
  const amount = item.isFree ? 0 : Number(item.price);
  const card = shop?.cardNumber as string | undefined;
  const copyCard = () => { navigator.clipboard.writeText((card || "").replace(/\D/g, "")); toast.success("شماره کارت کپی شد"); };
  const copyAmount = () => { navigator.clipboard.writeText(String(amount)); toast.success("مبلغ کپی شد"); };
  const pretty = (card || "").replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1-");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141422] border border-white/10 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{item.isFree ? "دریافت رایگان" : "خرید"} — {item.title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {item.isFree ? (
          <p className="text-sm text-white/60">این فایل رایگان است. برای دریافت با فروشنده در تماس باشید.</p>
        ) : card ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white/80"><CreditCard className="w-4 h-4 text-orange-500" /> پرداخت کارت‌به‌کارت</div>
            <button onClick={copyCard} className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-black/20 border border-white/10 hover:border-orange-500/40 group">
              <span className="font-mono tracking-widest" dir="ltr">{pretty}</span>
              <Copy className="w-4 h-4 text-white/40 group-hover:text-orange-500" />
            </button>
            <button onClick={copyAmount} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 hover:border-orange-500/40 group">
              <span className="text-xs text-white/50">مبلغ</span>
              <span className="flex items-center gap-2"><span className="font-bold text-orange-500">{formatPrice(amount)}</span><Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-orange-500" /></span>
            </button>
            <div className="flex items-center justify-between text-xs text-white/50">
              {shop?.cardHolder && <span>به نام: {shop.cardHolder}</span>}
              {shop?.bankName && <span>{shop.bankName}</span>}
            </div>
            <p className="text-[11px] text-white/40">پس از واریز، رسید را برای فروشنده بفرستید تا فایل ارسال شود.</p>
          </div>
        ) : (
          <p className="text-sm text-white/60">فروشنده هنوز روش پرداخت را تنظیم نکرده است. لطفاً مستقیم با او تماس بگیرید.</p>
        )}
      </div>
    </div>
  );
}
