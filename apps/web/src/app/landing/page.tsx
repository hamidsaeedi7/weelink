import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowLeft, Wand2, GraduationCap, Download, Package, Bot, BarChart3,
  Check, ShieldCheck, Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "یک لینک، یک فروشگاه کامل",
  description: "دیگه لازم نیست برای هر کاری یک ابزار جدا داشته باشی. ویلینک استوری‌ساز، فروشگاه، دوره، فایل دیجیتال و پاسخ‌گوی خودکار را در یک لینک برایت می‌سازد.",
};

const FEATURES = [
  {
    icon: Wand2,
    title: "ساخت خودکار استوری محصول",
    desc: "برای هر محصول و هر مناسبتی، از فروش ویژه تا شب یلدا، در چند کلیک یک استوری حرفه‌ای بساز.",
  },
  {
    icon: GraduationCap,
    title: "فروش امن دوره‌های آموزشی",
    desc: "دوره‌هایت را با محافظت از محتوا، حفظ حریم خصوصی مدرس و دسترسی کنترل‌شده بفروش.",
  },
  {
    icon: Download,
    title: "فروش فایل دیجیتال بدون سایت مستقل",
    desc: "فایل، قالب، کد، پروژه یا محصول دیجیتال خودت را بدون نیاز به طراحی سایت و درگاه پرداخت جداگانه عرضه کن.",
  },
  {
    icon: Package,
    title: "فروش محصولات فیزیکی",
    desc: "برای هر نوع فروشگاه، از پوشاک تا صنایع‌دستی، فروشگاه آنلاین با سبد خرید و مدیریت سفارش بساز.",
  },
  {
    icon: Bot,
    title: "پاسخ‌گویی خودکار در بله و تلگرام",
    desc: "حتی وقتی آنلاین نیستی، ویلینک به پیام‌های مشتریان پاسخ می‌دهد.",
  },
  {
    icon: BarChart3,
    title: "آمار دقیق بازدید و کلیک",
    desc: "عملکرد هر لینک را جداگانه بررسی کن و ببین چه چیزی واقعاً نتیجه می‌دهد.",
  },
];

const TRUST_LINES = [
  "ساخت لینک و ثبت محصول همیشه رایگان",
  "۷ روز استفاده آزمایشی رایگان، بدون نیاز به خرید اشتراک",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0F] noise">
      {/* Minimal header — logo + one CTA, no links out */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-4 mt-4">
          <nav className="max-w-5xl mx-auto glass-chrome px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/weeelink.png?v=8" alt="ویلینک" className="w-8 h-8 rounded-xl" />
              <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">
                وی<span className="text-accent">لینک</span>
              </span>
            </div>
            <Link href="/register" className="btn-primary py-2 px-4 text-sm">
              شروع رایگان
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-32 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-60"
              style={{ background: "var(--accent-glow)" }} />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
              <Sparkles className="w-3.5 h-3.5" />
              دیگه لازم نیست برای هر کاری یک ابزار جدا داشته باشی
            </div>

            <h1 className="text-4xl sm:text-6xl font-black leading-tight text-balance text-gray-900 dark:text-white">
              وقتی بقیه یک صفحه لینک می‌دن،<br />
              <span className="gradient-text">ویلینک یک فروشگاه کامل</span> می‌سازه
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              استوری‌ساز، فروشگاه، دورهٔ آموزشی، فایل دیجیتال و پاسخ‌گوی خودکار —
              همه در یک لینک، بدون نیاز به دانش فنی.
            </p>

            <div className="flex flex-col items-center gap-3">
              <Link href="/register"
                className="btn-primary text-base px-10 py-4 shadow-[0_0_30px_var(--accent-glow)]">
                همین حالا رایگان شروع کن
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <p className="text-xs text-gray-500">بدون نیاز به کارت بانکی — ثبت‌نام کمتر از ۲ دقیقه</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section-padding">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white text-center mb-10">
              همه ابزارهای فروش آنلاینت، یک‌جا
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="glass-card p-6 space-y-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--accent-glow)" }}>
                    <f.icon className="w-5 h-5" style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="glass-card p-6 sm:p-8 space-y-4">
            {TRUST_LINES.map((line) => (
              <div key={line} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-glow)" }}>
                  <Check className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                </span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{line}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 text-xs text-gray-500 dark:text-gray-500">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              درگاه پرداخت ایرانی و نماد اعتماد الکترونیکی
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-padding text-center">
          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              همین حالا شروع کن
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              ساخت لینک همیشه رایگان است. هر وقت خواستی، بدون تعهد به Pro ارتقا بده.
            </p>
            <Link href="/register" className="btn-primary inline-flex text-base px-10 py-4">
              ثبت‌نام رایگان در weeelink.ir
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
