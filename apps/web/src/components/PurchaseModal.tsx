"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Tag, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { formatPrice } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
  item: any;
  shop: any;
  onClose: () => void;
  /** نوع آیتم — تعیین‌کنندهٔ endpoint خرید و اعتبارسنجی کد تخفیف */
  kind?: "DIGITAL_FILE" | "COURSE";
}

// مودال خرید: فقط درگاه پرداخت ویلینک (کارت‌به‌کارت غیرفعال) + نام/موبایل الزامی + کد تخفیف
export function PurchaseModal({ item, shop, onClose, kind = "DIGITAL_FILE" }: Props) {
  const router = useRouter();
  const basePrice = item.isFree ? 0 : Number(item.price);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amount = couponResult?.finalPrice ?? basePrice;

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true); setCouponError("");
    try {
      const { data } = await axios.post(`${API}/api/v1/coupons/validate`, {
        code: coupon, total: basePrice, itemType: kind, itemIds: [item.id],
      });
      const d = data.data || data;
      setCouponResult({ ...d, code: coupon });
      toast.success(`کد تخفیف اعمال شد: ${formatPrice(d.discount)} تخفیف`);
    } catch (e: any) {
      setCouponResult(null);
      setCouponError(e.response?.data?.message || "کد تخفیف معتبر نیست");
    } finally {
      setCouponLoading(false);
    }
  };

  const submit = async () => {
    if (buyerName.trim().length < 2) { toast.error("نام و نام خانوادگی را وارد کنید"); return; }
    if (!/^09\d{9}$/.test(buyerPhone.trim())) { toast.error("شماره موبایل معتبر نیست"); return; }

    setSubmitting(true);
    try {
      const path = kind === "COURSE" ? "courses" : "digital-files";
      const { data } = await axios.post(`${API}/api/v1/shops/${shop.slug}/${path}/${item.id}/purchase`, {
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        couponCode: couponResult?.code,
      });
      const d = data.data || data;

      if (d.free) {
        if (kind === "COURSE") {
          router.push(`/payment/result?status=success&type=COURSE&license=${encodeURIComponent(d.licenseCode)}`);
        } else {
          window.location.href = d.downloadUrl;
        }
      } else {
        window.location.href = d.gatewayUrl;
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا در ثبت خرید");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141422] border border-white/10 rounded-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">{item.isFree ? "دریافت رایگان" : "خرید"} — {item.title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">نام و نام خانوادگی</label>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50">شماره موبایل</label>
            <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="09xxxxxxxxx" dir="ltr" inputMode="numeric" maxLength={11}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-left focus:outline-none focus:border-orange-500/50" />
          </div>

          {!item.isFree && (
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
          )}

          {!item.isFree && (
            <div className="flex items-center justify-between px-1">
              {couponResult && <span className="text-white/30 line-through text-xs">{formatPrice(basePrice)}</span>}
              <span className="font-black text-orange-500 text-lg mr-auto">{formatPrice(amount)}</span>
            </div>
          )}

          <button onClick={submit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400
                       text-white font-bold text-sm transition-all disabled:opacity-60">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {item.isFree || amount <= 0 ? "دریافت" : "پرداخت از درگاه"}
          </button>

          <p className="flex items-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> پرداخت امن از طریق درگاه ویلینک — کارت‌به‌کارت غیرفعال است.
          </p>
        </div>
      </div>
    </div>
  );
}
