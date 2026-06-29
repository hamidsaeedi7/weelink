"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, fmtPrice } from "@/lib/api";
import { Eye, MousePointer, ShoppingCart, DollarSign, RefreshCw, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Period = 7 | 30 | 90;

interface DailySignup {
  date: string;
  count: number;
}

interface BlockStat {
  type: string;
  count: number;
  totalClicks: number;
}

interface StatsData {
  totalVisits: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  dailySignups: DailySignup[];
}

interface ToolStatsData {
  blockStats: BlockStat[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [toolStats, setToolStats] = useState<ToolStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, toolStatsData] = await Promise.all([
        adminApi.stats(period),
        adminApi.getToolStats(),
      ]);
      setStats(statsData);
      setToolStats(toolStatsData);
    } catch {
      console.error("خطا در دریافت آمار");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = stats
    ? [
        {
          label: "کاربران کل",
          value: (stats.users?.total ?? stats.totalVisits ?? 0).toLocaleString("fa-IR"),
          icon: Eye,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/40",
        },
        {
          label: "کلیک بلوک‌ها",
          value: (toolStats?.totalClicks ?? stats.totalClicks ?? 0).toLocaleString("fa-IR"),
          icon: MousePointer,
          color: "text-purple-600 dark:text-purple-400",
          bg: "bg-purple-100 dark:bg-purple-900/40",
        },
        {
          label: "سفارشات",
          value: (stats.orders ?? stats.totalOrders ?? 0).toLocaleString("fa-IR"),
          icon: ShoppingCart,
          color: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-100 dark:bg-orange-900/40",
        },
        {
          label: "درآمد",
          value: fmtPrice(stats.revenue ?? stats.totalRevenue ?? 0),
          icon: DollarSign,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/40",
        },
      ]
    : [];

  const chartData = (stats?.dailySignups ?? []).map((d) => ({
    date: d.date,
    عضوها: d.count,
  }));

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">آمار و تحلیل</h1>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {([7, 30, 90] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {p} روز
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="btn-primary flex items-center gap-2 text-sm">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            بازخوانی
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="glass-card p-5 h-24 animate-pulse bg-gray-100 dark:bg-gray-800" />
              ))
          : statCards.map((s) => (
              <div key={s.label} className="glass-card p-5 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <s.icon size={22} className={s.color} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Daily signups bar chart */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-orange-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">عضوهای روزانه</h2>
        </div>
        {loading ? (
          <div className="h-48 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-400">
            داده‌ای برای نمایش وجود ندارد
          </div>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--tooltip-bg, #1f2937)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f9fafb",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="عضوها" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Block type breakdown */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center gap-2 p-5 border-b border-gray-200 dark:border-gray-700">
          <BarChart2 size={18} className="text-orange-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">آمار بلاک‌ها بر اساس نوع</h2>
        </div>
        {loading ? (
          <div className="h-32 animate-pulse bg-gray-100 dark:bg-gray-800 m-4 rounded-lg" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {["نوع بلاک", "تعداد", "کل کلیک‌ها"].map((h) => (
                    <th
                      key={h}
                      className="text-right px-5 py-3 font-medium text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(toolStats?.blockStats ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400">
                      داده‌ای وجود ندارد
                    </td>
                  </tr>
                ) : (
                  (toolStats?.blockStats ?? []).map((bs) => (
                    <tr
                      key={bs.type}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                        {bs.type}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {bs.count.toLocaleString("fa-IR")}
                      </td>
                      <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                        {bs.totalClicks.toLocaleString("fa-IR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
