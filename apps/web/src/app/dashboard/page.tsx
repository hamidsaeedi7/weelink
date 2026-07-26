"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Eye, MousePointer, ShoppingBag, TrendingUp, Link2, Settings,
  Check, Circle, Clock, Crown, Tag, Loader2,
} from "lucide-react";
import Link from "next/link";
import { analyticsApi, ordersApi, accountApi, couponsApi, shopsApi } from "@/lib/api";
import { toPersianNumber } from "@/lib/utils";

const QUICK_ACTIONS = [
  { href: "/dashboard/blocks", icon: Link2, label: "ویرایش لینک‌ها", desc: "بلوک‌های صفحه بیو" },
  { href: "/dashboard/products", icon: ShoppingBag, label: "مدیریت محصولات", desc: "افزودن و ویرایش" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "آمار و تحلیل", desc: "بازدید و کلیک" },
  { href: "/dashboard/account", icon: Settings, label: "تنظیمات", desc: "پروفایل و فروشگاه" },
];

function fmtMoney(n: number) {
  return n > 0 ? `${toPersianNumber(n.toLocaleString("fa-IR"))} ت` : "۰ ت";
}

interface Insight { key: string; tone: "warning" | "info" | "danger"; text: string; cta: string; href: string }

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ allTimeViews: number; blockClicks: number; orders: { count: number; revenue: number } } | null>(null);
  const [shop, setShop] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboard(30).catch(() => null),
      shopsApi.getMine().catch(() => null),
      ordersApi.getMine(1).catch(() => null),
      accountApi.getMe().catch(() => null),
      couponsApi.getAll().catch(() => null),
    ]).then(([statsRes, shopRes, ordersRes, meRes, couponsRes]) => {
      setStats((statsRes as any)?.data ?? statsRes ?? null);
      const shopData = (shopRes as any)?.data ?? shopRes ?? null;
      setShop(shopData);

      const built: Insight[] = [];

      const orders = ((ordersRes as any)?.data ?? ordersRes)?.orders ?? [];
      const staleOrders = orders.filter((o: any) =>
        o.status === "PENDING" && Date.now() - new Date(o.createdAt).getTime() > 24 * 3600 * 1000,
      );
      if (staleOrders.length > 0) {
        built.push({
          key: "stale-orders", tone: "warning",
          text: `${toPersianNumber(String(staleOrders.length))} سفارش بیش از ۲۴ ساعت در انتظار پیگیری‌اند`,
          cta: "بررسی سفارش‌ها", href: "/dashboard/orders",
        });
      }

      const me = (meRes as any)?.data ?? meRes ?? null;
      if (me?.plan === "PRO" && me?.planExpiresAt) {
        const daysLeft = Math.ceil((new Date(me.planExpiresAt).getTime() - Date.now()) / 86400000);
        if (daysLeft <= 7 && daysLeft >= 0) {
          built.push({
            key: "plan-expiry", tone: "danger",
            text: daysLeft === 0 ? "اشتراک Pro شما امروز منقضی می‌شود" : `اشتراک Pro شما ${toPersianNumber(String(daysLeft))} روز دیگر منقضی می‌شود`,
            cta: "تمدید پلن", href: "/dashboard/plans",
          });
        }
      }

      const coupons = (couponsRes as any)?.data ?? couponsRes ?? [];
      const unusedCoupon = Array.isArray(coupons) ? coupons.find((c: any) => c.isActive && c.usedCount === 0) : null;
      if (unusedCoupon) {
        built.push({
          key: "unused-coupon", tone: "info",
          text: `کد تخفیف «${unusedCoupon.code}» هنوز هیچ استفاده‌ای نشده`,
          cta: "مدیریت تخفیف‌ها", href: "/dashboard/coupons",
        });
      }

      setInsights(built);
    }).finally(() => setLoading(false));
  }, []);

  const checklist = useMemo(() => {
    if (!shop) return [];
    return [
      { done: (shop.blocks?.length ?? 0) > 0, label: "افزودن اولین بلوک", href: "/dashboard/blocks" },
      { done: Boolean(shop.bio) && Boolean(shop.avatarUrl), label: "تکمیل بیو و آواتار", href: "/dashboard/shop" },
      { done: (shop._count?.products ?? 0) > 0, label: "افزودن اولین محصول یا فایل", href: "/dashboard/products" },
    ];
  }, [shop]);

  const checklistDone = checklist.filter((c) => c.done).length;
  const checklistComplete = checklist.length > 0 && checklistDone === checklist.length;

  const STATS = [
    { label: "بازدید کل", value: toPersianNumber(String(stats?.allTimeViews ?? 0)), icon: Eye, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "کلیک لینک‌ها", value: toPersianNumber(String(stats?.blockClicks ?? 0)), icon: MousePointer, color: "text-accent-400", bg: "bg-accent-500/10" },
    { label: "سفارش‌های جدید", value: toPersianNumber(String(stats?.orders?.count ?? 0)), icon: ShoppingBag, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "درآمد ماه", value: fmtMoney(stats?.orders?.revenue ?? 0), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const toneStyles: Record<Insight["tone"], { bg: string; icon: string; iconBg: string }> = {
    warning: { bg: "bg-amber-500/5 border-amber-500/20", icon: "text-amber-500", iconBg: "bg-amber-500/10" },
    danger: { bg: "bg-red-500/5 border-red-500/20", icon: "text-red-500", iconBg: "bg-red-500/10" },
    info: { bg: "bg-accent-500/5 border-accent-500/20", icon: "text-accent-500", iconBg: "bg-accent-500/10" },
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">خوش آمدی 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          صفحه بیوی شما آماده است. شروع کن به اضافه کردن لینک‌ها.
        </p>
      </div>

      {/* Onboarding checklist — replaces the old static banner, only shown until complete */}
      {!loading && checklist.length > 0 && !checklistComplete && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-black text-gray-900 dark:text-white">صفحه بیو خود را کامل کن</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {toPersianNumber(String(checklistDone))} از {toPersianNumber(String(checklist.length))} گام انجام شد
              </div>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent-500/10 text-accent-500 font-black text-xs">
              {toPersianNumber(String(Math.round((checklistDone / checklist.length) * 100)))}٪
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-accent-500 transition-all" style={{ width: `${(checklistDone / checklist.length) * 100}%` }} />
          </div>
          <div className="space-y-1">
            {checklist.map((step) => (
              <Link key={step.label} href={step.href}
                className="flex items-center gap-2.5 py-1.5 text-sm group">
                {step.done
                  ? <Check className="w-4 h-4 text-accent-500 shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
                <span className={step.done ? "text-gray-400 line-through" : "text-gray-700 dark:text-gray-300 group-hover:text-accent-500"}>
                  {step.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent-500" /></div>
      )}

      {/* Insights feed — proactive action cards instead of a passive stat wall */}
      {!loading && insights.length > 0 && (
        <div className="space-y-2.5">
          {insights.map((ins) => {
            const t = toneStyles[ins.tone];
            return (
              <Link key={ins.key} href={ins.href}
                className={`flex items-center gap-3 p-4 rounded-2xl border ${t.bg} hover:brightness-105 transition-all`}>
                <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center shrink-0`}>
                  {ins.tone === "warning" && <Clock className={`w-4.5 h-4.5 ${t.icon}`} />}
                  {ins.tone === "danger" && <Crown className={`w-4.5 h-4.5 ${t.icon}`} />}
                  {ins.tone === "info" && <Tag className={`w-4.5 h-4.5 ${t.icon}`} />}
                </div>
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{ins.text}</span>
                <span className={`text-xs font-bold shrink-0 ${t.icon}`}>{ins.cta} ←</span>
              </Link>
            );
          })}
        </div>
      )}

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a, i) => (
            <Link key={i} href={a.href}
              className="glass-card p-5 hover:border-accent-500/20 transition-all duration-200
                         hover:-translate-y-0.5 group">
              <a.icon className="w-6 h-6 text-accent-500 mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-sm text-gray-900 dark:text-white">{a.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
