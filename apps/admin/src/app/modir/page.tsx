"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, DollarSign, Ticket, TrendingUp, UserPlus, BarChart3, Loader2,
  Landmark, Globe, ArrowLeft, Store, FileDown, Handshake, Flame, Megaphone,
} from "lucide-react";
import { adminApi, fmtPrice } from "@/lib/api";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STAT_COLORS: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-500",
  blue: "bg-blue-500/10 text-blue-400",
  green: "bg-green-500/10 text-green-400",
  red: "bg-red-500/10 text-red-400",
};

function StatCard({ label, value, sub, icon: Icon, color = "emerald" }: any) {
  return (
    <div className="glass-card p-5 hover:border-emerald-500/20 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${STAT_COLORS[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/modir/shops", icon: Store, label: "فروشگاه‌ها" },
  { href: "/modir/digital-content", icon: FileDown, label: "محتوای دیجیتال" },
  { href: "/modir/affiliate", icon: Handshake, label: "همکاری در فروش" },
  { href: "/modir/flash-sales", icon: Flame, label: "فلش‌سیل‌ها" },
  { href: "/modir/broadcast", icon: Megaphone, label: "پیام همگانی" },
  { href: "/modir/domains", icon: Globe, label: "دامنه‌های اختصاصی" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "شب بخیر";
  if (h < 12) return "صبح بخیر";
  if (h < 18) return "ظهر بخیر";
  return "عصر بخیر";
}

export default function ModirDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (adminApi.stats() as Promise<any>).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
    </div>
  );

  const chartData = (data?.dailySignups || []).slice(-14).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("fa-IR", { month: "numeric", day: "numeric" }),
    count: d.count,
  }));

  const attentionItems = [
    {
      href: "/modir/tickets",
      label: "تیکت باز",
      value: data?.openTickets || 0,
      hint: "منتظر پاسخ",
      show: (data?.openTickets || 0) > 0,
      color: "text-red-500 bg-red-500/10",
    },
    {
      href: "/modir/finance",
      label: "تسویه‌نشده",
      value: fmtPrice(data?.unsettledAmount || 0),
      hint: "قابل واریز به فروشندگان",
      show: (data?.unsettledAmount || 0) > 0,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      href: "/modir/domains",
      label: "دامنه در انتظار",
      value: data?.pendingDomains || 0,
      hint: "اتصال CDN کامل نشده",
      show: (data?.pendingDomains || 0) > 0,
      color: "text-blue-500 bg-blue-500/10",
    },
  ].filter((i) => i.show);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">{greeting()} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">خلاصه وضعیت سیستم ویلینک</p>
      </div>

      {attentionItems.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">نیازمند توجه</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {attentionItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors group"
              >
                <div>
                  <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label} · {item.hint}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 group-hover:-translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="کل کاربران"   value={data?.users?.total || 0}    sub={`+${data?.users?.new7d || 0} این هفته`} color="emerald" />
        <StatCard icon={TrendingUp} label="کاربران PRO"  value={data?.users?.pro || 0}      sub="اشتراک فعال"                             color="blue" />
        <StatCard icon={DollarSign} label="درآمد کل"     value={fmtPrice(data?.revenue||0)} sub={`${data?.orders||0} سفارش`}             color="green" />
        <StatCard icon={Ticket}     label="تیکت باز"     value={data?.openTickets || 0}     sub="منتظر پاسخ"                              color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            ثبت‌نام روزانه (۱۴ روز اخیر)
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 12, color: "#f9fafb", fontSize: 12 }} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? "#10B981" : "#10B98140"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            خلاصه
          </h2>
          <div className="space-y-4">
            {[
              { label: "فروشگاه‌های فعال", value: data?.shops || 0,      color: "bg-emerald-500" },
              { label: "کل سفارشات",       value: data?.orders || 0,     color: "bg-blue-500" },
              { label: "پست‌های وبلاگ",    value: data?.blogPosts || 0,  color: "bg-purple-500" },
              { label: "کاربران PRO",      value: data?.users?.pro || 0, color: "bg-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">دسترسی سریع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors text-center"
            >
              <l.icon className="w-5 h-5 text-emerald-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
