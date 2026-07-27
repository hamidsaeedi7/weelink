"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Globe, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";

interface DomainRow {
  id: string;
  slug: string;
  name: string;
  customDomain: string;
  verificationStatus: string | null;
  cdnStatus: string | null;
  cdnCname: string | null;
  cdnError: string | null;
  verifiedAt: string | null;
  user: { email: string | null; phone: string | null };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  DNS_PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  SSL_ISSUING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ERROR: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCustomDomains();
      setDomains(data ?? []);
    } catch {
      toast.error("خطا در بارگذاری دامنه‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">دامنه‌های اختصاصی</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">وضعیت اتصال دامنه اختصاصی و CDN فروشگاه‌ها</p>
        </div>
        <button onClick={load} className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> بازخوانی
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-16 text-gray-400">هیچ فروشگاهی دامنه اختصاصی ثبت نکرده</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">دامنه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">مالک</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت DNS</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت CDN</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">خطا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {domains.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 dark:text-white">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300" dir="ltr">{d.customDomain}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{d.user.email || d.user.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.verificationStatus || ""] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {d.verificationStatus || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.cdnStatus || ""] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
                        {d.cdnStatus || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate" title={d.cdnError || ""}>
                      {d.cdnError || "—"}
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
