"use client";

import { useEffect, useState } from "react";
import { Users, DollarSign, Ticket, TrendingUp, UserPlus, BarChart3, Loader2 } from "lucide-react";
import { adminApi, fmtPrice } from "@/lib/api";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function StatCard({ label, value, sub, icon: Icon, color = "orange" }: any) {
  const c: Record<string, string> = {
    orange: "bg-orange-500/10 text-orange-500",
    blue:   "bg-blue-500/10 text-blue-400",
    green:  "bg-green-500/10 text-green-400",
    red:    "bg-red-500/10 text-red-400",
  };
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ModirDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (adminApi.stats() as Promise<any>).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );

  const chartData = (data?.dailySignups || []).slice(-14).map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("fa-IR", { month: "numeric", day: "numeric" }),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">داشبورد</h1>
        <p className="text-sm text-gray-500 mt-1">خلاصه وضعیت سیستم</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}      label="کل کاربران"   value={data?.users?.total || 0}    sub={`+${data?.users?.new7d || 0} این هفته`} color="orange" />
        <StatCard icon={TrendingUp} label="کاربران PRO"  value={data?.users?.pro || 0}      sub="اشتراک فعال"                             color="blue" />
        <StatCard icon={DollarSign} label="درآمد کل"     value={fmtPrice(data?.revenue||0)} sub={`${data?.orders||0} سفارش`}             color="green" />
        <StatCard icon={Ticket}     label="تیکت باز"     value={data?.openTickets || 0}     sub="منتظر پاسخ"                              color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-orange-400" />
            ثبت‌نام روزانه (۱۴ روز اخیر)
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 12, color: "#f9fafb", fontSize: 12 }} cursor={{ fill: "rgba(249,115,22,0.05)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill={i === chartData.length - 1 ? "#f97316" : "#f9731640"} />
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
              { label: "فروشگاه‌های فعال", value: data?.shops || 0,      color: "bg-orange-500" },
              { label: "کل سفارشات",       value: data?.orders || 0,     color: "bg-blue-500" },
              { label: "پست‌های وبلاگ",    value: data?.blogPosts || 0,  color: "bg-purple-500" },
              { label: "کاربران PRO",      value: data?.users?.pro || 0, color: "bg-green-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
