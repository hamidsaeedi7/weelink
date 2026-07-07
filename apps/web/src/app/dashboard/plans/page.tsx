"use client";

import { useState, useEffect } from "react";
import { Check, Crown, Loader2, Zap, Star, Infinity, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { accountApi, paymentsApi } from "@/lib/api";
import { toPersianNumber } from "@/lib/utils";

// ─── Plan data (matches landing page exactly) ────────────────────────────────

const PLANS = [
  { id: "monthly",   label: "ماهانه",       months: 1,   price: 199000,   period: "ماه",               save: null,       savePct: null,  popular: false },
  { id: "quarterly", label: "سه‌ماهه",      months: 3,   price: 499000,   period: "۳ ماه",             save: 98000,      savePct: "۱۶٪", popular: false },
  { id: "biannual",  label: "شش‌ماهه",      months: 6,   price: 899000,   period: "۶ ماه",             save: 295000,     savePct: "۲۵٪", popular: false },
  { id: "annual",    label: "سالانه",       months: 12,  price: 1599000,  period: "سال",               save: 789000,     savePct: "۳۳٪", popular: true  },
  { id: "lifetime",  label: "مادام‌العمر",  months: 999, price: 4999000,  period: "یک بار برای همیشه", save: null,       savePct: null,  popular: false },
];

const FREE_FEATURES = [
  "صفحه بیو با URL اختصاصی",
  "بلوک‌های لینک نامحدود",
  "فروشگاه با کارمزد ۰٪",
  "فروش فایل دیجیتال و دوره",
  "رزرو وقت / نوبت‌دهی",
  "QR Code اختصاصی",
  "آنالیتیکس پایه",
  "همکاری در فروش (افیلیت)",
  "پاسخ خودکار",
];

const PRO_FEATURES = [
  "همه امکانات رایگان",
  "لینک کوتاه اختصاصی",
  "مدیریت مخاطبان",
  "تقویم محتوایی با یادآور",
  "تست A/B",
  "دامنه اختصاصی",
  "آنالیتیکس پیشرفته",
  "لینک زمان‌بندی‌شده",
  "پشتیبانی اولویت‌دار",
];

function fmtPrice(n: number) {
  return toPersianNumber(n.toLocaleString("fa-IR")) + " تومان";
}

// ─── Expiry countdown bar ─────────────────────────────────────────────────────

function ExpiryBanner({ expiresAt }: { expiresAt: string }) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const totalMs = expiry.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(totalMs / 86400000));
  const pct = Math.max(0, Math.min(100, (daysLeft / 365) * 100));
  const urgent = daysLeft <= 30;
  const warning = daysLeft <= 60;

  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${
      urgent
        ? "bg-red-500/10 border-red-500/30"
        : warning
        ? "bg-yellow-500/10 border-yellow-500/30"
        : "bg-accent-500/10 border-accent-500/30"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {urgent ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <Crown className="w-5 h-5 text-accent-400 shrink-0" />
          )}
          <div>
            <p className={`font-black text-sm ${urgent ? "text-red-400" : "text-accent-400"}`}>
              حساب PRO فعال
            </p>
            <p className={`text-xs mt-0.5 ${urgent ? "text-red-300/70" : "text-accent-300/70"}`}>
              انقضا: {expiry.toLocaleDateString("fa-IR")}
            </p>
          </div>
        </div>
        <div className={`text-left ${urgent ? "text-red-400" : warning ? "text-yellow-400" : "text-accent-400"}`}>
          <p className="text-2xl font-black">{toPersianNumber(daysLeft)}</p>
          <p className="text-xs">روز مانده</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            urgent ? "bg-red-500" : warning ? "bg-yellow-500" : "bg-accent-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {urgent && (
        <p className="text-xs text-red-400 font-medium">
          ⚠️ اشتراک شما به زودی منقضی می‌شود. همین الان تمدید کنید.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState("annual");
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    (accountApi.getMe() as Promise<any>).then((u) => {
      setUser(u);
    }).finally(() => setLoading(false));
  }, []);

  const isPro = user?.plan === "PRO";
  const proExpiry = user?.planExpiresAt;
  const current = PLANS.find((p) => p.id === activePlan)!;
  const isLifetime = activePlan === "lifetime";
  const monthlyPrice = 199000;

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { gatewayUrl } = await paymentsApi.requestPlanPayment(current.months);
      window.location.href = gatewayUrl;
    } catch (e: any) {
      toast.error(e?.message || "خطا در اتصال به درگاه پرداخت");
      setUpgrading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">پلن‌ها</h1>
        <p className="text-sm text-gray-500 mt-1">شروع رایگان. ارتقا هر وقت خواستی.</p>
      </div>

      {/* Expiry banner — only for PRO users */}
      {isPro && proExpiry && <ExpiryBanner expiresAt={proExpiry} />}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Free card */}
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/[0.03] p-6 space-y-5">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">پلن رایگان</div>
            <div className="text-4xl font-black text-gray-900 dark:text-white">۰</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">تومان — برای همیشه</div>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <div className="py-2 rounded-xl border border-gray-200 dark:border-white/10 text-center text-sm text-gray-500 font-bold">
              پلن فعلی شما
            </div>
          )}
        </div>

        {/* PRO card */}
        <div className="relative">
          {/* Gradient border */}
          <div className="absolute -inset-px rounded-2xl"
               style={{ background: "linear-gradient(135deg, #f9731680, #f9731630)" }} />
          <div className="relative rounded-2xl bg-gray-100 dark:bg-[#0D0D18] p-6 space-y-5">

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1 font-medium text-accent-500 text-sm">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  پلن Pro
                  {isLifetime && <Infinity className="w-4 h-4 mr-1" />}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                  {fmtPrice(current.price)}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">/ {current.period}</span>
                  {current.savePct && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400">
                      {current.savePct} تخفیف
                    </span>
                  )}
                </div>
                {current.save && (
                  <p className="text-xs text-green-500 mt-1">
                    معادل {fmtPrice(current.save)} صرفه‌جویی نسبت به ماهانه
                  </p>
                )}
              </div>
              {current.popular && (
                <div className="px-3 py-1 rounded-full font-bold text-xs text-white shrink-0 bg-accent-500">
                  محبوب‌ترین
                </div>
              )}
            </div>

            {/* Duration tabs */}
            <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-black/30 rounded-xl">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlan(p.id)}
                  className="flex-1 min-w-fit py-1.5 px-2 text-xs rounded-lg transition-all font-medium whitespace-nowrap"
                  style={activePlan === p.id
                    ? { backgroundColor: "#f97316", color: "white" }
                    : { color: "var(--text-secondary, #6b7280)" }}>
                  {p.label}
                </button>
              ))}
            </div>

            <ul className="space-y-2.5">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-4 h-4 text-accent-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {isPro && (
              <div className="text-xs text-accent-400/70 text-center">
                برای تمدید یا ارتقای دوره، پلن را انتخاب کنید
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={handleUpgrade}
        disabled={upgrading}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl
                   bg-accent-500 hover:bg-accent-400 text-white font-black text-base
                   transition-all disabled:opacity-60
                   shadow-[0_8px_30px_rgb(var(--accent-500-rgb) / 0.35)]">
        {upgrading
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : isLifetime
          ? <Infinity className="w-5 h-5" />
          : <Zap className="w-5 h-5" />}
        {upgrading
          ? "در حال فعال‌سازی..."
          : isPro
          ? isLifetime
            ? `خرید مادام‌العمر — ${fmtPrice(current.price)}`
            : `تمدید PRO — ${fmtPrice(current.price)}`
          : isLifetime
          ? `خرید مادام‌العمر — ${fmtPrice(current.price)}`
          : `ارتقا به PRO — ${fmtPrice(current.price)}`}
      </button>

      {/* Feature comparison note */}
      <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 space-y-2">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">امکانات رایگان vs PRO</p>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <p className="font-bold text-gray-700 dark:text-gray-300">رایگان ✓</p>
            <p className="text-gray-500">لینک‌های نامحدود</p>
            <p className="text-gray-500">فروشگاه + فایل + دوره</p>
            <p className="text-gray-500">رزرو وقت</p>
            <p className="text-gray-500">QR Code</p>
            <p className="text-gray-500">آمار پایه</p>
            <p className="text-gray-500">افیلیت + پاسخ خودکار</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-accent-500">PRO اضافه می‌کند ✦</p>
            <p className="text-gray-500">لینک کوتاه</p>
            <p className="text-gray-500">مدیریت مخاطبان</p>
            <p className="text-gray-500">تقویم محتوا</p>
            <p className="text-gray-500">آنالیتیکس پیشرفته</p>
            <p className="text-gray-500">دامنه اختصاصی</p>
            <p className="text-gray-500">لینک زمان‌بندی</p>
          </div>
        </div>
      </div>
    </div>
  );
}
