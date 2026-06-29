"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { Cpu, HardDrive, Clock, Monitor, Users, ShoppingCart, Package, RefreshCw } from "lucide-react";

interface ServerStats {
  cpu: { cores: number };
  memory: { total: number; used: number; free: number };
  uptime: number; // seconds
  platform: string;
  nodeVersion: string;
  db: {
    users: number;
    shops: number;
    orders: number;
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} روز`);
  if (hours > 0) parts.push(`${hours} ساعت`);
  if (minutes > 0) parts.push(`${minutes} دقیقه`);
  return parts.join(" و ") || "کمتر از یک دقیقه";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

interface ProgressBarProps {
  percent: number;
}

function MemoryProgressBar({ percent }: ProgressBarProps) {
  return (
    <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-orange-500 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}

export default function ServerStatsPage() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getServerStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch {
      console.error("خطا در دریافت آمار سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const memPercent =
    stats && stats.memory.total > 0
      ? (stats.memory.used / stats.memory.total) * 100
      : 0;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">آمار سرور</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            بروزرسانی خودکار هر ۵ ثانیه
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              آخرین بروزرسانی: {lastUpdated.toLocaleTimeString("fa-IR")}
            </span>
          )}
          <button onClick={fetchStats} className="btn-primary flex items-center gap-2 text-sm">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            بازخوانی
          </button>
        </div>
      </div>

      {/* Server status */}
      <div className="glass-card p-4 mb-6 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <span className="text-green-700 dark:text-green-400 font-semibold">سرور فعال</span>
        <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {stats?.platform ?? "—"} &mdash; Node {stats?.nodeVersion ?? "—"}
        </span>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="glass-card p-5 h-32 animate-pulse bg-gray-100 dark:bg-gray-800"
              />
            ))}
        </div>
      ) : (
        <>
          {/* System info cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* CPU */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <Cpu size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">پردازنده</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {stats?.cpu.cores ?? "—"} هسته
                  </p>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Clock size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">آپتایم</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {stats ? formatUptime(stats.uptime) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Platform */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Monitor size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">سیستم‌عامل</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {stats?.platform ?? "—"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Node {stats?.nodeVersion ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Memory */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <HardDrive size={20} className="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">حافظه RAM</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {stats ? `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}` : "—"}
                  </p>
                </div>
              </div>
              <MemoryProgressBar percent={memPercent} />
              <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
                <span>آزاد: {stats ? formatBytes(stats.memory.free) : "—"}</span>
                <span>کل: {stats ? formatBytes(stats.memory.total) : "—"}</span>
              </div>
            </div>
          </div>

          {/* DB stats */}
          <div className="glass-card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">آمار پایگاه داده</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "کاربران", value: stats?.db.users, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40" },
                { label: "فروشگاه‌ها", value: stats?.db.shops, icon: Package, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/40" },
                { label: "سفارشات", value: stats?.db.orders, icon: ShoppingCart, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/40" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.value?.toLocaleString("fa-IR") ?? "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
