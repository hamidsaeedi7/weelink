"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp, Shield, ExternalLink, ShoppingBag, MessageCircle, Send, ClipboardList } from "lucide-react";

const STATS = [
  { value: "۰٪", label: "کارمزد فروش" },
  { value: "۷", label: "پلتفرم پشتیبانی" },
  { value: "۲۴/۷", label: "پشتیبانی فارسی" },
];

const MESSENGERS = [
  { label: "تلگرام",   color: "#2AABEE" },
  { label: "اینستاگرام", color: "#E1306C" },
  { label: "واتساپ",  color: "#25D366" },
  { label: "یوتیوب",  color: "#FF0000" },
  { label: "بله",     color: "#00A652" },
  { label: "ایتا",    color: "#1565C0" },
  { label: "روبیکا",  color: "#7C3AED" },
];

/* Social platform config — icons rendered inside component, not at module level */
type SocialConfig = {
  name: string;
  delay: string;
  top?: string;
  bottom?: string;
  right?: string;
  left?: string;
  bg: string;
  path: string;
};

/**
 * Four platforms, placed symmetrically (two per side at matching heights)
 * rather than seven scattered ones — the headline is the point of the hero,
 * and a ring of drifting logos was pulling attention off it.
 */
const SOCIALS: SocialConfig[] = [
  {
    name: "Instagram", delay: "0.2s",
    top: "18%", right: "6%",
    bg: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    name: "Telegram", delay: "0.6s",
    top: "18%", left: "6%",
    bg: "linear-gradient(135deg,#2AABEE,#229ED9)",
    path: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
  },
  {
    name: "WhatsApp", delay: "1.0s",
    bottom: "22%", right: "6%",
    bg: "linear-gradient(135deg,#25D366,#128C7E)",
    path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z",
  },
  {
    name: "بله", delay: "1.4s",
    bottom: "22%", left: "6%",
    bg: "linear-gradient(135deg,#00A652,#007A3D)",
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",
  },
];

function SocialIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
      <path d={path} />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-60"
          style={{ background: "var(--accent-glow)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--accent-glow)" }}
        />
      </div>

      {/* Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(var(--accent) 1px, transparent 1px),
                            linear-gradient(90deg, var(--accent) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Social Logos — desktop only */}
      {SOCIALS.map((s) => (
        <div
          key={s.name}
          title={s.name}
          className="absolute hidden xl:flex items-center justify-center w-11 h-11 rounded-2xl shadow-xl z-10"
          style={{
            background: s.bg,
            top: s.top,
            bottom: s.bottom,
            right: s.right,
            left: s.left,
            opacity: 0,
            animation: `float-in 0.7s ease ${s.delay} forwards, float-bob 3.5s ease-in-out ${s.delay} infinite`,
          }}
        >
          <SocialIcon path={s.path} />
        </div>
      ))}

      <div className="relative z-10 w-full max-w-7xl mx-auto section-padding">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left — Content */}
          <div className="flex-1 text-center lg:text-right space-y-8">

            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
              style={{
                background: "var(--accent-glow)",
                border: "1px solid var(--accent)",
                color: "var(--accent)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <span>یک لینک ، یک فروشگاه کامل</span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight text-balance text-gray-900 dark:text-white">
                یک لینک،
                <br />
                <span className="gradient-text">همه چیز</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed">
                صفحه بیو حرفه‌ای، فروشگاه آنلاین و ابزارهای مارکتینگ —
                بدون دانش فنی، بدون کارمزد
              </p>
            </div>

            {/* CTA Buttons — one primary action, one secondary that shows a
                real published page rather than scrolling to the feature list. */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/register" className="btn-primary text-base px-8 py-4">
                شروع رایگان
                <ArrowLeft aria-hidden="true" className="icon-md" />
              </Link>
              <Link href="/medadplus" className="btn-secondary text-base px-8 py-4">
                مشاهده یک صفحهٔ واقعی
                <ExternalLink aria-hidden="true" className="icon-sm" />
              </Link>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 justify-center lg:justify-start pt-4">
              {STATS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-black text-accent">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Messengers */}
            <div className="space-y-2 flex flex-col items-center lg:items-start">
              <span className="text-xs text-gray-500">پشتیبانی از:</span>
              <div className="flex items-center gap-2 flex-wrap justify-center lg:justify-start">
                {MESSENGERS.map((b, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg
                               bg-gray-100 dark:bg-white/5
                               border border-gray-200 dark:border-white/5
                               text-gray-700 dark:text-gray-300 font-medium"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Phone Mockup */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-8 rounded-full blur-3xl"
        style={{ background: "var(--accent-glow)" }}
      />

      <div
        className="relative w-[260px] sm:w-[280px] rounded-[40px] border border-white/10
                    bg-gradient-to-b from-[#1A1A2E] to-[#0F0F1A]
                    shadow-[0_50px_100px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
                    overflow-hidden"
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-20 h-1.5 bg-white/10 rounded-full" />
        </div>

        <div className="px-4 pb-8 space-y-3">
          <div className="flex flex-col items-center py-4 space-y-2">
            {/* Monogram instead of an emoji avatar — system emoji rendering
                differs per OS and looked like placeholder art. */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black text-white"
              style={{
                background: "linear-gradient(135deg,var(--accent)cc,var(--accent)55)",
              }}
            >
              ن
            </div>
            <div className="text-white font-bold text-sm">فروشگاه نمونه</div>
            <div className="text-gray-300 text-xs text-center">فروش لباس زنانه | تهران</div>
          </div>

          {[
            { Icon: ShoppingBag, label: "مشاهده محصولات" },
            { Icon: MessageCircle, label: "پیام در واتساپ" },
            { Icon: Send, label: "کانال بله ما" },
            { Icon: ClipboardList, label: "ثبت سفارش آنلاین" },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Icon aria-hidden="true" className="icon-sm text-accent-300 shrink-0" />
              <span className="text-white/90 text-xs font-medium">{label}</span>
            </div>
          ))}

          <div className="text-center pt-2">
            <span className="text-gray-600 text-[10px]">ساخته شده با </span>
            <span className="text-[10px] font-bold text-accent">ویلینک</span>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 sm:-right-6 top-20 glass-card px-3 py-2 text-xs shadow-xl">
        <div className="flex items-center gap-2 text-gray-800 dark:text-white/80">
          <TrendingUp className="w-3 h-3 text-accent" />
          <span>+۱۲۴ بازدید امروز</span>
        </div>
      </div>
      <div className="absolute -left-4 sm:-left-6 bottom-24 glass-card px-3 py-2 text-xs shadow-xl">
        <div className="flex items-center gap-2 text-gray-800 dark:text-white/80">
          <Shield className="w-3 h-3 text-green-500" />
          <span>کارمزد: ۰٪</span>
        </div>
      </div>
    </div>
  );
}
