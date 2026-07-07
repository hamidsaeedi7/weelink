"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, X, Check } from "lucide-react";

const PRO_PERKS = [
  "لینک کوتاه اختصاصی",
  "مدیریت مخاطبان و تست A/B",
  "تقویم محتوایی با یادآور",
  "دامنه اختصاصی + آنالیتیکس پیشرفته",
];

/**
 * Global modal shown when a free user tries to use a PRO-only feature.
 * Triggered by the "pro-required" window event dispatched from the axios
 * interceptor (see lib/api.ts).
 */
export function ProUpgradeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("pro-required", handler);
    return () => window.removeEventListener("pro-required", handler);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
      dir="rtl"
    >
      <div className="relative w-full max-w-sm">
        {/* Gradient border */}
        <div
          className="absolute -inset-px rounded-3xl"
          style={{ background: "linear-gradient(135deg, #f9731699, #f9731633)" }}
        />
        <div className="relative rounded-3xl bg-gray-100 dark:bg-[#0D0D18] p-6 space-y-5">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-accent-500/15 flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-accent-500" />
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              این قابلیت مخصوص پلن Pro است
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              با ارتقا به Pro همه‌ی امکانات حرفه‌ای ویلینک رو باز کن
            </p>
          </div>

          <ul className="space-y-2.5">
            {PRO_PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <Check className="w-4 h-4 text-accent-500 shrink-0" />
                {p}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2.5 pt-1">
            <Link
              href="/dashboard/plans"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl
                         bg-accent-500 hover:bg-accent-400 text-white font-black text-sm
                         transition-all shadow-[0_8px_30px_rgb(var(--accent-500-rgb) / 0.35)]"
            >
              <Crown className="w-4 h-4" />
              مشاهده پلن‌ها و ارتقا
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              بعداً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
