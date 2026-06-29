"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Copy, RefreshCw, Tag } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  shopName?: string;
  usedCount: number;
  maxUses: number;
  expiresAt?: string;
  isActive: boolean;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function DiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    maxUses: "",
    expiresAt: "",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data ?? []);
    } catch {
      toast.error("خطا در بارگذاری کدهای تخفیف");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error("کد الزامی است"); return; }
    if (!form.value || Number(form.value) <= 0) { toast.error("مقدار تخفیف الزامی است"); return; }
    setCreating(true);
    try {
      await adminApi.createCoupon({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : -1,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success("کد تخفیف ایجاد شد");
      setForm({ code: "", type: "percent", value: "", maxUses: "", expiresAt: "" });
      loadCoupons();
    } catch {
      toast.error("خطا در ایجاد کد تخفیف");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`آیا از حذف کد "${code}" اطمینان دارید؟`)) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success("کد تخفیف حذف شد");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("خطا در حذف کد تخفیف");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("کد کپی شد");
  };

  const formatExpiry = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">کدهای تخفیف</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">مدیریت کدهای تخفیف عمومی</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <Tag size={18} />
          ایجاد کد تخفیف جدید
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                کد تخفیف <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  className="input-base flex-1 font-mono uppercase tracking-widest"
                  placeholder="DISCOUNT20"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => set("code", generateCode())}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="تولید خودکار"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                نوع تخفیف
              </label>
              <select
                className="input-base w-full"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="percent">درصدی</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                مقدار {form.type === "percent" ? "(%)" : "(تومان)"} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="input-base w-full"
                placeholder={form.type === "percent" ? "20" : "50000"}
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                min={1}
                max={form.type === "percent" ? 100 : undefined}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                حداکثر استفاده (-۱ = نامحدود)
              </label>
              <input
                type="number"
                className="input-base w-full"
                placeholder="-1"
                value={form.maxUses}
                onChange={(e) => set("maxUses", e.target.value)}
                min={-1}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                تاریخ انقضا (اختیاری)
              </label>
              <input
                type="date"
                className="input-base w-full"
                value={form.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Plus size={16} />
              {creating ? "در حال ایجاد..." : "ایجاد کد"}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-white">
            کدهای تخفیف ({coupons.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">کد تخفیفی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">کد</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">نوع</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">مقدار</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">استفاده</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">انقضا</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-gray-900 dark:text-white tracking-wider">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.type === "percent"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {coupon.type === "percent" ? "درصدی" : "ثابت"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      {coupon.type === "percent" ? `%${coupon.value}` : `${coupon.value.toLocaleString("fa-IR")} ت`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {coupon.shopName ?? "عمومی"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {coupon.usedCount}/{coupon.maxUses === -1 ? "∞" : coupon.maxUses}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatExpiry(coupon.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coupon.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {coupon.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="کپی کد"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
