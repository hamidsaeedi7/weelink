"use client";

import { ShoppingBag, Link2, BarChart3, MessageCircle, Zap, Globe } from "lucide-react";

const FEATURES = [
  {
    icon: Link2,
    title: "بلوک‌های محتوا نامحدود",
    desc: "لینک، تصویر، ویدیو، پیام‌رسان، نقشه، موسیقی و بیشتر — همه در یک صفحه",
    color: "text-blue-500",
    bg: "bg-blue-600/10",
  },
  {
    icon: ShoppingBag,
    title: "فروشگاه آنلاین رایگان",
    desc: "محصولات فیزیکی و دیجیتال. سبد خرید، درگاه پرداخت ایرانی. کارمزد ۰٪.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: MessageCircle,
    title: "پیام‌رسان‌های ایرانی",
    desc: "بله، ایتا، روبیکا، گپ، سروش — کنار واتساپ و تلگرام",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    icon: BarChart3,
    title: "آنالیتیکس هوشمند",
    desc: "تعداد بازدید، کلیک هر لینک، منبع ترافیک و موقعیت جغرافیایی",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Zap,
    title: "سریع و بهینه",
    desc: "سرور داخل ایران. لود سریع. PWA برای نصب روی موبایل",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Globe,
    title: "دامنه اختصاصی",
    desc: "دامنه دلخواه خود را به صفحه بیو وصل کن. فقط در پلن Pro.",
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
];

export function Features() {
  return (
    <section className="section-padding bg-gray-50 dark:bg-[#0D0D18]" id="features">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-blue-600/10 border border-blue-600/20 text-blue-500 text-sm">
            <span className="dot-orange" />
            ویژگی‌ها
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white">
            همه چیزی که نیاز داری
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            از لینک بیو ساده تا فروشگاه کامل — همه رایگان، همه فارسی
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group glass-card p-6 hover:border-orange-500/20
                         transition-all duration-300 hover:-translate-y-1
                         hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_rgba(249,115,22,0.05)]"
            >
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4
                               group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
