"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { ShoppingCart, Tag, Loader2, Trash2, CheckCircle, CreditCard, Copy } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import axios from "axios";

// کارت‌به‌کارت فروشنده — نمایش شماره کارت با قابلیت کپی
function BankCardBox({ card, holder, bank }: { card: string; holder?: string; bank?: string }) {
  const copy = () => { navigator.clipboard.writeText(card.replace(/\D/g, "")); toast.success("شماره کارت کپی شد"); };
  const pretty = card.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1-");
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
        <CreditCard className="w-4 h-4 text-orange-500" /> پرداخت کارت‌به‌کارت
      </div>
      <button type="button" onClick={copy}
        className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl
                   bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/10
                   hover:border-orange-500/40 transition-all group">
        <span className="font-mono text-base tracking-widest text-gray-900 dark:text-white" dir="ltr">{pretty}</span>
        <Copy className="w-4 h-4 text-gray-400 group-hover:text-orange-500 shrink-0" />
      </button>
      <div className="flex items-center justify-between text-xs text-gray-500">
        {holder && <span>به نام: <span className="text-gray-700 dark:text-gray-300 font-medium">{holder}</span></span>}
        {bank && <span>{bank}</span>}
      </div>
      <p className="text-[11px] text-gray-400">
        پس از واریز، رسید را از طریق راه‌های ارتباطی فروشنده ارسال کنید.
      </p>
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface CheckoutForm {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  note?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const { items, clear, total, remove, update, shopSlug } = useCart();
  const [shopBank, setShopBank] = useState<{ cardNumber?: string; cardHolder?: string; bankName?: string } | null>(null);
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    axios.get(`${API}/api/v1/shops/${slug}`)
      .then((r) => { const s = r.data?.data || r.data; setShopBank({ cardNumber: s?.cardNumber, cardHolder: s?.cardHolder, bankName: s?.bankName }); })
      .catch(() => {});
  }, [slug]);
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>();

  const finalTotal = couponResult?.finalPrice ?? total();
  const discount = couponResult?.discount ?? 0;

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <ShoppingCart className="w-12 h-12 opacity-20" />
        <p>سبد خرید خالی است</p>
        <button onClick={() => router.push(`/${slug}/shop`)}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 transition-all">
          رفتن به فروشگاه
        </button>
      </div>
    );
  }

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/v1/coupons/validate`, {
        code: coupon,
        total: total(),
      });
      setCouponResult(data.data || data);
      toast.success(`کد تخفیف اعمال شد: ${formatPrice(data.data?.discount || data.discount)} تخفیف`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "کد تخفیف معتبر نیست");
      setCouponResult(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const onSubmit = async (form: CheckoutForm) => {
    setSubmitting(true);
    try {
      const { data: orderRes } = await axios.post(`${API}/api/v1/orders`, {
        shopSlug: slug,
        ...form,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        couponCode: couponResult?.code,
      });

      const order = orderRes.data || orderRes;

      // Request payment
      const { data: payRes } = await axios.post(`${API}/api/v1/payments/request`, {
        orderNumber: order.orderNumber,
        amount: finalTotal,
        callbackUrl: `${window.location.origin}/payment/verify`,
      });

      const payment = payRes.data || payRes;
      clear();
      router.push(payment.paymentUrl);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا در ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F] py-8">
      <div className="max-w-lg mx-auto px-4 space-y-6">
        <h1 className="text-xl font-black text-gray-900 dark:text-white">تسویه‌حساب</h1>

        {/* Cart Items */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              سبد خرید ({toPersianNumber(items.length)} محصول)
            </span>
          </div>
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 dark:border-white/5 last:border-0">
              {item.image ? (
                <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-orange-500 font-bold">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => update(item.productId, item.qty - 1)}
                  className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/10 text-xs flex items-center justify-center">
                  -
                </button>
                <span className="text-sm font-bold w-4 text-center">{toPersianNumber(item.qty)}</span>
                <button onClick={() => update(item.productId, item.qty + 1)}
                  className="w-6 h-6 rounded-lg bg-orange-500 text-white text-xs flex items-center justify-center">
                  +
                </button>
                <button onClick={() => remove(item.productId)}
                  className="w-6 h-6 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="کد تخفیف"
              disabled={!!couponResult}
              className="input-base pr-9 text-sm"
            />
          </div>
          {couponResult ? (
            <button onClick={() => { setCouponResult(null); setCoupon(""); }}
              className="px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-sm font-bold">
              حذف
            </button>
          ) : (
            <button onClick={applyCoupon} disabled={couponLoading}
              className="px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-sm font-bold hover:opacity-90 transition-all">
              {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "اعمال"}
            </button>
          )}
        </div>

        {couponResult && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400 font-bold">
              کد {couponResult.code}: {formatPrice(couponResult.discount)} تخفیف
            </span>
          </div>
        )}

        {/* Order Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-4 space-y-4">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">اطلاعات تماس</h2>

            <div>
              <input {...register("customerName", { required: "نام الزامی است" })}
                placeholder="نام و نام خانوادگی *"
                className="input-base text-sm" />
              {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>}
            </div>

            <div>
              <input {...register("customerPhone", {
                required: "شماره موبایل الزامی است",
                pattern: { value: /^09[0-9]{9}$/, message: "شماره موبایل معتبر نیست" }
              })}
                placeholder="شماره موبایل * (مثال: 09123456789)"
                dir="ltr"
                className="input-base text-sm" />
              {errors.customerPhone && <p className="text-xs text-red-500 mt-1">{errors.customerPhone.message}</p>}
            </div>

            <textarea {...register("customerAddress")}
              placeholder="آدرس (اختیاری)"
              rows={2}
              className="input-base text-sm resize-none" />

            <textarea {...register("note")}
              placeholder="توضیحات سفارش (اختیاری)"
              rows={2}
              className="input-base text-sm resize-none" />
          </div>

          {/* Price Summary */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>جمع کالاها</span>
              <span>{formatPrice(total())}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-500">
                <span>تخفیف</span>
                <span>- {formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 dark:text-white border-t border-gray-100 dark:border-white/10 pt-2">
              <span>مبلغ پرداختی</span>
              <span className="text-orange-500">{formatPrice(finalTotal)}</span>
            </div>
          </div>

          {/* پرداخت کارت‌به‌کارت فروشنده (در صورت تنظیم) */}
          {shopBank?.cardNumber && (
            <BankCardBox card={shopBank.cardNumber} holder={shopBank.cardHolder} bank={shopBank.bankName} />
          )}

          <button type="submit" disabled={submitting}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl
                       bg-orange-500 hover:bg-orange-400 text-white font-black text-base
                       transition-all disabled:opacity-60 shadow-[0_8px_30px_rgba(249,115,22,0.3)]">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {submitting ? "در حال پردازش..." : `پرداخت آنلاین ${formatPrice(finalTotal)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
