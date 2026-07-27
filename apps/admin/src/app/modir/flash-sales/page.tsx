"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Flame } from "lucide-react";
import { adminApi, fmtPrice, fmtDate } from "@/lib/api";

interface FlashSale {
  id: string;
  title: string;
  originalPrice: number;
  salePrice: number;
  endsAt: string;
  isActive: boolean;
  clickCount: number;
  shop: { name: string; slug: string };
}

export default function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getFlashSalesAdmin();
      setSales(data.sales ?? []);
    } catch {
      toast.error("خطا در بارگذاری فلش‌سیل‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isExpired = (endsAt: string) => new Date(endsAt).getTime() < Date.now();

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">فلش‌سیل‌ها</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">نظارت بر فلش‌سیل‌های فعال در کل پلتفرم</p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 text-gray-400">فلش‌سیلی ثبت نشده</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عنوان</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">قیمت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">کلیک</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">پایان</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {sales.map((s) => {
                  const expired = isExpired(s.endsAt);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Flame size={14} className="text-orange-400 shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">{s.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.shop.name}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 line-through text-xs ml-1">{fmtPrice(s.originalPrice)}</span>
                        <span className="font-medium text-green-600 dark:text-green-400">{fmtPrice(s.salePrice)}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{s.clickCount.toLocaleString("fa-IR")}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDate(s.endsAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          !s.isActive ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          : expired ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}>
                          {!s.isActive ? "غیرفعال" : expired ? "منقضی شده" : "در حال اجرا"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
