"use client";

import { useState } from "react";
import { CreditCard, Copy, X, Send, Tag, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { BrandLogo } from "./blocks/brand-icons";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

interface Props {
  item: any;
  shop: any;
  onClose: () => void;
  /** نوع آیتم برای اعتبارسنجی کد تخفیف هدفمند */
  kind?: "DIGITAL_FILE" | "COURSE";
}

// مودال خرید: پرداخت کارت‌به‌کارت (شماره کارت + مبلغ، هر دو قابل کپی) + کد تخفیف
export function PurchaseModal({ item, shop, onClose, kind = "DIGITAL_FILE" }: Props) {
  const basePrice = item.isFree ? 0 : Number(item.price);
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  const amount = couponResult?.finalPrice ?? basePrice;
  const card = shop?.cardNumber as string | undefined;
  const copyCard = () => { navigator.clipboard.writeText((card || "").replace(/\D/g, "")); toast.success("شماره کارت کپی شد"); };
  const copyAmount = () => { navigator.clipboard.writeText(String(amount)); toast.success("مبلغ کپی شد"); };
  const pretty = (card || "").replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1-");

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true); setCouponError("");
    try {
      const { data } = await axios.post(`${API}/api/v1/coupons/validate`, {
        code: coupon, total: basePrice, itemType: kind, itemIds: [item.id],
      });
      const d = data.data || data;
      setCouponResult(d);
      toast.success(`کد تخفیف اعمال شد: ${formatPrice(d.discount)} تخفیف`);
    } catch (e: any) {
      setCouponResult(null);
      setCouponError(e.response?.data?.message || "کد تخفیف معتبر نیست");
    } finally {
      setCouponLoading(false);
    }
  };

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
            {/* کد تخفیف */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input value={coupon} onChange={(e) => setCoupon(e.target.value)} disabled={!!couponResult}
                    placeholder="کد تخفیف" dir="ltr"
                    className="w-full pr-8 pl-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-left focus:outline-none focus:border-orange-500/50" />
                </div>
                {couponResult ? (
                  <button onClick={() => { setCouponResult(null); setCoupon(""); }}
                    className="px-3 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold">حذف</button>
                ) : (
                  <button onClick={applyCoupon} disabled={couponLoading}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold disabled:opacity-60">
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "اعمال"}
                  </button>
                )}
              </div>
              {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
              {couponResult && (
                <p className="text-[11px] text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {formatPrice(couponResult.discount)} تخفیف اعمال شد</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-white/80"><CreditCard className="w-4 h-4 text-orange-500" /> پرداخت کارت‌به‌کارت</div>
            <button onClick={copyCard} className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-black/20 border border-white/10 hover:border-orange-500/40 group">
              <span className="font-mono tracking-widest text-white" dir="ltr">{pretty}</span>
              <Copy className="w-4 h-4 text-white/40 group-hover:text-orange-500" />
            </button>
            <button onClick={copyAmount} className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 hover:border-orange-500/40 group">
              <span className="text-xs text-white/50">مبلغ</span>
              <span className="flex items-center gap-2">
                {couponResult && <span className="text-white/30 line-through text-xs">{formatPrice(basePrice)}</span>}
                <span className="font-bold text-orange-500">{formatPrice(amount)}</span>
                <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-orange-500" />
              </span>
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
