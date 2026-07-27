"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Handshake } from "lucide-react";
import { adminApi, fmtPrice } from "@/lib/api";

interface AffiliateLink {
  id: string;
  title: string;
  originalUrl: string;
  commission: number;
  clickCount: number;
  earnings: number;
  isActive: boolean;
  shop: { name: string; slug: string };
}

export default function AffiliatePage() {
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAffiliateLinksAdmin();
      setLinks(data.links ?? []);
    } catch {
      toast.error("خطا در بارگذاری لینک‌های افیلیت");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">همکاری در فروش</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">نظارت بر لینک‌های افیلیت و درآمد فروشگاه‌ها</p>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-16 text-gray-400">لینک افیلیتی ثبت نشده</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عنوان</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">کمیسیون</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">کلیک</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">درآمد</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {links.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Handshake size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{l.shop.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">%{l.commission}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{l.clickCount.toLocaleString("fa-IR")}</td>
                    <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">{fmtPrice(l.earnings)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        l.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}>{l.isActive ? "فعال" : "غیرفعال"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
