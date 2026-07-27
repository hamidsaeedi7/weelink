"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Store, Search, Ban, CheckCircle2, ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Shop {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  customDomain: string | null;
  user: { id: string; email: string | null; phone: string | null; plan: string };
  _count: { blocks: number; products: number; orders: number };
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getShops(p, s || undefined);
      setShops(data.shops ?? []);
      setPages(data.pages ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("خطا در بارگذاری فروشگاه‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page, search); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const handleToggle = async (shop: Shop) => {
    const verb = shop.isActive ? "مسدود" : "فعال";
    if (!confirm(`فروشگاه "${shop.name}" ${verb} شود؟`)) return;
    try {
      const updated = await adminApi.toggleShopActive(shop.id);
      toast.success(`فروشگاه ${updated.isActive ? "فعال" : "مسدود"} شد`);
      setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, isActive: updated.isActive } : s)));
    } catch {
      toast.error("خطا در تغییر وضعیت فروشگاه");
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">فروشگاه‌ها</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">مشاهده و مدیریت مستقیم صفحات بیوی فروشگاه‌ها ({total.toLocaleString("fa-IR")})</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو با نام یا شناسه فروشگاه..."
            className="input-base w-full pr-9"
          />
        </div>
        <button type="submit" className="btn-primary">جستجو</button>
      </form>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-16 text-gray-400">فروشگاهی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">مالک</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">پلن</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">لینک/محصول/سفارش</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Store size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{shop.name}</p>
                          <a href={`https://weeelink.ir/${shop.slug}`} target="_blank" rel="noopener noreferrer"
                             className="text-xs text-gray-400 hover:text-accent-500 flex items-center gap-1" dir="ltr">
                            {shop.slug} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{shop.user.email || shop.user.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        shop.user.plan === "PRO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}>{shop.user.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {shop._count.blocks} / {shop._count.products} / {shop._count.orders}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shop.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>{shop.isActive ? "فعال" : "مسدود"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(shop)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          shop.isActive
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        }`}
                      >
                        {shop.isActive ? <><Ban size={13} /> مسدودسازی</> : <><CheckCircle2 size={13} /> فعال‌سازی</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${p === page ? "bg-accent-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
            >
              {p.toLocaleString("fa-IR")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
