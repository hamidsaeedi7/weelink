"use client";

import { CreditCard, Copy, X, Send } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { BrandLogo } from "./blocks/brand-icons";

// دکمهٔ راه ارتباطی تحویل (تلگرام/بله/روبیکا/ایتا/واتساپ)
function DeliveryContact({ type, contact, note }: { type?: string; contact?: string; note?: string }) {
  if (!contact) {
    return <p className="text-[11px] text-white/40">پس از واریز، رسید را برای فروشنده بفرستید تا فایل/دسترسی ارسال شود.</p>;
  }
  const prefixes: Record<string, string> = {
    telegram: "https://t.me/", bale: "https://ble.ir/", rubika: "https://rubika.ir/",
    eitaa: "https://eitaa.com/", whatsapp: "https://wa.me/",
  };
  const raw = contact.replace(/^@/, "");
  const href = raw.startsWith("http") ? raw : (prefixes[type || "telegram"] || "") + raw;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-white/50">پس از واریز، رسید را از این راه برای فروشنده بفرستید:</p>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/40 transition-all">
        <BrandLogo platform={type || "telegram"} size={22} />
        <span className="flex-1 text-sm text-white text-left" dir="ltr">{contact}</span>
        <Send className="w-4 h-4 text-orange-500" />
      </a>
      {note && <p className="text-[11px] text-white/40">{note}</p>}
    </div>
  );
}

// مودال خرید: پرداخت کارت‌به‌کارت (شماره کارت + مبلغ، هر دو قابل کپی)
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
          <h3 className="font-bold text-white">{item.isFree ? "دریافت رایگان" : "خرید"} — {item.title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {item.isFree ? (
          <p className="text-sm text-white/60">این مورد رایگان است. برای دریافت با فروشنده در تماس باشید.</p>
        ) : card ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white/80"><CreditCard className="w-4 h-4 text-orange-500" /> پرداخت کارت‌به‌کارت</div>
            <button onClick={copyCard} className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-black/20 border border-white/10 hover:border-orange-500/40 group">
              <span className="font-mono tracking-widest text-white" dir="ltr">{pretty}</span>
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
            <DeliveryContact type={shop?.deliveryType} contact={shop?.deliveryContact} note={shop?.deliveryNote} />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-white/60">فروشنده هنوز روش پرداخت آنلاین/کارت تنظیم نکرده است.</p>
            <DeliveryContact type={shop?.deliveryType} contact={shop?.deliveryContact} note={shop?.deliveryNote} />
          </div>
        )}
      </div>
    </div>
  );
}
