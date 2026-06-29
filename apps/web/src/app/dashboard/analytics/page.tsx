"use client";

import { useState, useEffect } from "react";
import { Eye, MousePointerClick, ShoppingBag, TrendingUp, Loader2, Link2, BarChart2 } from "lucide-react";
import { analyticsApi } from "@/lib/api";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import { BarChart, MiniChart } from "@/components/ui/MiniChart";
import { toast } from "sonner";

const PERIODS = [
  { label: "۷ روز", days: 7 },
  { label: "۳۰ روز", days: 30 },
  { label: "۹۰ روز", days: 90 },
];

function StatCard({
  icon: Icon, label, value, sub, color = "orange",
}: {
  icon: any; label: string; value: string | number; sub?: string; color?: "orange" | "blue" | "green" | "purple";
}) {
  const colors = {
    orange: "bg-orange-500/10 text-orange-500",
    blue:   "bg-blue-500/10 text-blue-400",
    green:  "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{toPersianNumber(value)}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<any>(null);
  const [referers, setReferers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.getDashboard(period) as Promise<any>,
      analyticsApi.getReferers() as Promise<any[]>,
    ]).then(([dash, refs]) => {
      setData(dash);
      setReferers(refs || []);
    }).catch(() => toast.error("خطا در بارگذاری آمار"))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );

  const dailyViews: { date: string; count: number }[] = data?.dailyViews || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">آنالیتیکس</h1>
          <p className="text-sm text-gray-500">مجموع بازدید: {toPersianNumber(data?.allTimeViews || 0)}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                period === p.days
                  ? "bg-white dark:bg-white/10 text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="بازدید صفحه" value={data?.pageViews || 0} color="orange" />
        <StatCard icon={MousePointerClick} label="کلیک روی لینک‌ها" value={data?.blockClicks || 0} color="blue" />
        <StatCard icon={TrendingUp} label="نرخ کلیک" value={`${data?.clickRate || 0}٪`} color="purple" />
        <StatCard
          icon={ShoppingBag}
          label="فروش"
          value={data?.orders?.count || 0}
          sub={data?.orders?.revenue ? formatPrice(data.orders.revenue) : undefined}
          color="green"
        />
      </div>

      {/* Views Chart */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-orange-400" />
            بازدید روزانه
          </h2>
          <span className="text-xs text-gray-400">{period} روز گذشته</span>
        </div>
        <div className="h-40 relative">
          {dailyViews.length > 0 ? (
            <BarChart data={dailyViews} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              داده‌ای موجود نیست
            </div>
          )}
        </div>
        {/* X axis labels */}
        {dailyViews.length > 0 && (
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-gray-400">
              {new Date(dailyViews[0]?.date).toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(dailyViews[dailyViews.length - 1]?.date).toLocaleDateString("fa-IR", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Blocks */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-orange-400" />
            پربازدیدترین لینک‌ها
          </h2>
          {data?.topBlocks?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">کلیکی ثبت نشده</p>
          ) : (
            <div className="space-y-3">
              {data?.topBlocks?.map((block: any, i: number) => {
                const maxClicks = data.topBlocks[0]?.clickCount || 1;
                const pct = Math.round((block.clickCount / maxClicks) * 100);
                return (
                  <div key={block.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                        {block.label || block.url || block.type}
                      </span>
                      <span className="text-xs font-bold text-orange-500">{toPersianNumber(block.clickCount)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Referers */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            منابع ترافیک
          </h2>
          {referers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">اطلاعاتی موجود نیست</p>
          ) : (
            <div className="space-y-2">
              {referers.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                    {r.referer}
                  </span>
                  <span className="text-xs font-bold text-blue-400">{toPersianNumber(r.count)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
