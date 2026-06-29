"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Star } from "lucide-react";

const FREE_FEATURES = [
  "صفحه بیو با URL اختصاصی",
  "بلوک‌های محتوا نامحدود",
  "فروشگاه با کارمزد ۰٪",
  "درگاه پرداخت ایرانی",
  "پشتیبانی ۷ پلتفرم (تلگرام، اینستا، واتساپ...)",
  "آنالیتیکس پایه",
  "QR Code اختصاصی",
];

const PRO_FEATURES = [
  "همه امکانات رایگان",
  "ویدیو پروفایل ۱۰ ثانیه",
  "پس‌زمینه ویدیویی",
  "دامنه اختصاصی",
  "لینک زمان‌بندی‌شده",
  "نوبت‌دهی / رزرو",
  "تقویم محتوایی (با یادآور)",
  "فرم سفارش هوشمند",
  "Flash Sale با تایمر شمارش معکوس",
  "آنالیتیکس پیشرفته (منبع + موقعیت)",
  "اتصال Google Analytics",
];

const PLANS = [
  { id: "monthly",   label: "ماهانه",      price: "۱۹۹٬۰۰۰",   period: "ماه",              save: null,         popular: false },
  { id: "quarterly", label: "سه‌ماهه",     price: "۴۹۹٬۰۰۰",   period: "۳ ماه",            save: "۱۶٪ تخفیف", popular: false },
  { id: "biannual",  label: "شش‌ماهه",     price: "۸۹۹٬۰۰۰",   period: "۶ ماه",            save: "۲۵٪ تخفیف", popular: false },
  { id: "annual",    label: "سالانه",      price: "۱٬۵۹۹٬۰۰۰", period: "سال",              save: "۳۳٪ تخفیف", popular: true  },
  { id: "lifetime",  label: "مادام‌العمر", price: "۴٬۹۹۹٬۰۰۰", period: "یک بار برای همیشه", save: null,       popular: false },
];

export function Pricing() {
  const [activePlan, setActivePlan] = useState("annual");
  const current = PLANS.find((p) => p.id === activePlan)!;

  return (
    <section className="section-padding" id="pricing">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm"
               style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
            <span className="dot-orange" />
            تعرفه‌ها
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white">ساده و شفاف</h2>
          <p className="text-gray-500 dark:text-gray-400">شروع رایگان. ارتقا هر وقت خواستی.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="glass-card p-8 space-y-6">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">پلن رایگان</div>
              <div className="text-4xl font-black text-gray-900 dark:text-white">۰</div>
              <div className="text-gray-500 text-sm">تومان — برای همیشه</div>
            </div>
            <ul className="space-y-3">
              {FREE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full btn-secondary text-center py-3">
              شروع رایگان
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="relative">
            <div className="absolute -inset-px rounded-2xl"
                 style={{ background: "linear-gradient(135deg, var(--accent)80, var(--accent)30)" }} />
            <div className="relative glass-card p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1 font-medium text-accent text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    پلن Pro
                    {current.id === "lifetime" && <span className="text-base">∞</span>}
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                    {current.price}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-gray-500 text-sm">تومان / {current.period}</span>
                    {current.save && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold
                                       text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400">
                        {current.save}
                      </span>
                    )}
                  </div>
                </div>
                {current.popular && (
                  <div className="px-3 py-1 rounded-full font-bold text-xs text-white shrink-0"
                       style={{ backgroundColor: "var(--accent)" }}>
                    محبوب‌ترین
                  </div>
                )}
              </div>

              {/* Plan Tabs */}
              <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-black/30 rounded-xl">
                {PLANS.map((p) => (
                  <button key={p.id}
                    onClick={() => setActivePlan(p.id)}
                    className="flex-1 min-w-fit py-1.5 px-2 text-xs rounded-lg transition-all font-medium whitespace-nowrap"
                    style={activePlan === p.id
                      ? { backgroundColor: "var(--accent)", color: "white" }
                      : { color: "var(--text-secondary)" }}>
                    {p.label}
                  </button>
                ))}
              </div>

              <ul className="space-y-3">
                {PRO_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <Check className="w-4 h-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block w-full btn-primary text-center py-3">
                {current.id === "lifetime" ? "خرید مادام‌العمر" : "شروع با Pro"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
