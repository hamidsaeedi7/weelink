"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart2, MousePointer, Eye, TrendingUp } from "lucide-react";
import { adminApi } from "@/lib/api";

interface BlockStat {
  type: string;
  count: number;
  totalClicks: number;
  totalViews?: number;
}

interface ToolStats {
  totalClicks: number;
  totalViews: number;
  blockStats: BlockStat[];
}

const BLOCK_LABELS: Record<string, string> = {
  LINK: "لینک",
  MESSENGER: "پیام‌رسان",
  PHONE: "تلفن",
  IMAGE: "تصویر",
  VIDEO: "ویدیو",
  TEXT: "متن",
  FAQ: "پرسش و پاسخ",
  MAP: "نقشه",
  EMAIL_CAPTURE: "ایمیل",
  DIVIDER: "جداکننده",
  GROUP: "گروه",
  FEATURED: "ویژه",
};

const TYPE_COLORS: Record<string, string> = {
  LINK: "bg-blue-500",
  MESSENGER: "bg-purple-500",
  PHONE: "bg-emerald-500",
  IMAGE: "bg-pink-500",
  VIDEO: "bg-red-500",
  TEXT: "bg-slate-400",
  FAQ: "bg-amber-500",
  MAP: "bg-teal-500",
  EMAIL_CAPTURE: "bg-indigo-500",
  DIVIDER: "bg-gray-500",
  GROUP: "bg-orange-500",
  FEATURED: "bg-yellow-500",
};

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-white/50 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold mt-0.5">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p>
      </div>
    </div>
  );
}

export default function ToolStatsPage() {
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await adminApi.getToolStats();
        setStats(data);
      } catch {
        toast.error("خطا در بارگذاری آمار");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-white/50" dir="rtl">در حال بارگذاری...</div>;
  if (!stats) return <div className="flex items-center justify-center h-64 text-red-400" dir="rtl">خطا در بارگذاری</div>;

  const sorted = [...(stats.blockStats ?? [])].sort((a, b) => b.totalClicks - a.totalClicks);
  const maxClicks = sorted[0]?.totalClicks || 1;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">آمار ابزارها</h1>
        <p className="text-white/50 text-sm mt-1">تحلیل عملکرد بلاک‌ها و تعاملات کاربران</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="کل کلیک‌ها"
          value={stats.totalClicks}
          icon={<MousePointer size={20} className="text-white" />}
          color="bg-blue-500/20"
        />
        <StatCard
          label="کل بازدیدها"
          value={stats.totalViews}
          icon={<Eye size={20} className="text-white" />}
          color="bg-purple-500/20"
        />
        <StatCard
          label="نرخ کلیک کلی"
          value={stats.totalViews > 0 ? `${((stats.totalClicks / stats.totalViews) * 100).toFixed(1)}٪` : "—"}
          icon={<TrendingUp size={20} className="text-white" />}
          color="bg-emerald-500/20"
        />
      </div>

      {/* Block Type Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <BarChart2 size={16} className="text-white/50" />
          <h2 className="text-white font-semibold">آمار بر اساس نوع بلاک</h2>
        </div>
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30">داده‌ای یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/50">
                  <th className="text-right px-5 py-3 font-medium">نوع بلاک</th>
                  <th className="text-right px-5 py-3 font-medium">تعداد بلاک</th>
                  <th className="text-right px-5 py-3 font-medium">کلیک‌ها</th>
                  <th className="text-right px-5 py-3 font-medium">نرخ کلیک</th>
                  <th className="px-5 py-3 w-40">سهم نسبی</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((stat, i) => {
                  const label = BLOCK_LABELS[stat.type] ?? stat.type;
                  const color = TYPE_COLORS[stat.type] ?? "bg-white/30";
                  const views = stat.totalViews ?? 0;
                  const clickRate = views > 0 ? ((stat.totalClicks / views) * 100).toFixed(1) : "—";
                  const relShare = maxClicks > 0 ? (stat.totalClicks / maxClicks) * 100 : 0;
                  return (
                    <tr key={stat.type} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                          <span className="text-white font-medium">{label}</span>
                          <span className="text-white/30 text-xs font-mono">{stat.type}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white/70 tabular-nums">{stat.count.toLocaleString("fa-IR")}</td>
                      <td className="px-5 py-4">
                        <span className="text-white font-semibold tabular-nums">{stat.totalClicks.toLocaleString("fa-IR")}</span>
                      </td>
                      <td className="px-5 py-4">
                        {clickRate !== "—" ? (
                          <span className={`text-sm font-medium ${Number(clickRate) > 10 ? "text-emerald-400" : Number(clickRate) > 5 ? "text-amber-400" : "text-white/50"}`}>
                            {clickRate}٪
                          </span>
                        ) : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${color}`}
                              style={{ width: `${relShare}%` }}
                            />
                          </div>
                          <span className="text-white/40 text-xs w-10 text-left tabular-nums">{relShare.toFixed(0)}٪</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top performers highlight */}
      {sorted.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">پربازده‌ترین بلاک‌ها</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {sorted.slice(0, 4).map((stat) => {
              const label = BLOCK_LABELS[stat.type] ?? stat.type;
              const color = TYPE_COLORS[stat.type] ?? "bg-white/30";
              return (
                <div key={stat.type} className="bg-white/5 rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-white/70 text-xs">{label}</span>
                  </div>
                  <p className="text-white text-xl font-bold tabular-nums">{stat.totalClicks.toLocaleString("fa-IR")}</p>
                  <p className="text-white/30 text-xs">کلیک</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
