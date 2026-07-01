"use client";

import { BarChart3, Eye, MousePointer, ShoppingBag, TrendingUp, Link2, Settings } from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "بازدید کل", value: "۰", icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "کلیک لینک‌ها", value: "۰", icon: MousePointer, color: "text-orange-400", bg: "bg-orange-500/10" },
  { label: "سفارش‌های جدید", value: "۰", icon: ShoppingBag, color: "text-green-400", bg: "bg-green-500/10" },
  { label: "درآمد ماه", value: "۰ ت", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
];

const QUICK_ACTIONS = [
  { href: "/dashboard/blocks", icon: Link2, label: "ویرایش لینک‌ها", desc: "بلوک‌های صفحه بیو" },
  { href: "/dashboard/products", icon: ShoppingBag, label: "مدیریت محصولات", desc: "افزودن و ویرایش" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "آمار و تحلیل", desc: "بازدید و کلیک" },
  { href: "/dashboard/account", icon: Settings, label: "تنظیمات", desc: "پروفایل و فروشگاه" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">خوش آمدی 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          صفحه بیوی شما آماده است. شروع کن به اضافه کردن لینک‌ها.
        </p>
      </div>

      {/* Setup Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-6">
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -right-5 -bottom-5 w-32 h-32 bg-black/10 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="text-white">
            <div className="font-black text-lg">صفحه بیو خود را کامل کن</div>
            <div className="text-orange-100 text-sm mt-1">لوگو، بیو و اولین لینک را اضافه کن</div>
          </div>
          <Link href="/dashboard/blocks"
            className="flex-shrink-0 bg-white text-orange-600 font-bold px-5 py-2.5 rounded-xl
                       hover:bg-orange-50 transition-colors text-sm">
            شروع کن ←
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">دسترسی سریع</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={i} href={a.href}
              className="glass-card p-5 hover:border-orange-500/20 transition-all duration-200
                         hover:-translate-y-0.5 group">
              <a.icon className="w-6 h-6 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-gray-900 dark:text-white">{a.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
