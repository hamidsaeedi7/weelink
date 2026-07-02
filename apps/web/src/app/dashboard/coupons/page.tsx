"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Tag, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { toPersianNumber } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { code: "", type: "percent", value: 10, maxUses: -1, expiresAt: "" },
  });

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/api/v1/coupons`, { headers: authHeaders() });
      setCoupons(data.data || data);
    } catch { toast.error("خطا"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (form: any) => {
    try {
      const { data } = await axios.post(`${API}/api/v1/coupons`, {
        ...form,
        value: Number(form.value),
        maxUses: Number(form.maxUses),
        code: form.code.toUpperCase(),
      }, { headers: authHeaders() });
      setCoupons((prev) => [data.data || data, ...prev]);
      toast.success("کد تخفیف ساخته شد");
      setShowForm(false);
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await axios.delete(`${API}/api/v1/coupons/${id}`, { headers: authHeaders() });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("کد کپی شد");
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  if (loading) return <div className="flex justify-center h-48 items-center"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">کدهای تخفیف</h1>
          <p className="text-sm text-gray-500">{toPersianNumber(coupons.length)} کد</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(249,115,22,0.25)]">
          <Plus className="w-4 h-4" />
          کد جدید
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">ایجاد کد تخفیف</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <input {...register("code", { required: true })}
                placeholder="کد تخفیف (مثال: SUMMER20)" dir="ltr"
                className="input-base flex-1 uppercase tracking-widest font-mono text-sm" />
              <button type="button"
                onClick={() => {
                  const code = generateCode();
                  reset((v) => ({ ...v, code }));
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 text-xs hover:border-orange-500/40 hover:text-orange-500 transition-all">
                تولید خودکار
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select {...register("type")} className="input-base text-sm">
                <option value="percent">درصدی</option>
                <option value="fixed">مبلغ ثابت (تومان)</option>
              </select>
              <div className="relative">
                <input {...register("value", { required: true, min: 1 })}
                  type="number" placeholder="مقدار" className="input-base" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">حداکثر استفاده (-۱ = نامحدود)</label>
                <input {...register("maxUses")} type="number" className="input-base" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">تاریخ انقضا (اختیاری)</label>
                <input {...register("expiresAt")} type="date" className="input-base" />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-bold">
                انصراف
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                ایجاد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon List */}
      {coupons.length === 0 ? (
        <div className="text-center py-12 text-gray-400 space-y-3">
          <Tag className="w-10 h-10 mx-auto opacity-20" />
          <p>هنوز کد تخفیفی ندارید</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div key={coupon.id}
              className="flex items-center gap-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-gray-900 dark:text-white tracking-wider text-sm">
                    {coupon.code}
                  </span>
                  <button onClick={() => copyCode(coupon.code)}
                    className="text-gray-400 hover:text-orange-500 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="text-orange-400 font-bold">
                    {coupon.type === "percent"
                      ? `${toPersianNumber(coupon.value)}٪ تخفیف`
                      : `${toPersianNumber(coupon.value)} تومان تخفیف`}
                  </span>
                  <span>•</span>
                  <span>
                    استفاده: {toPersianNumber(coupon.usedCount)}/{coupon.maxUses === -1 ? "∞" : toPersianNumber(coupon.maxUses)}
                  </span>
                  {coupon.expiresAt && (
                    <>
                      <span>•</span>
                      <span className={new Date(coupon.expiresAt) < new Date() ? "text-red-400" : ""}>
                        انقضا: {new Date(coupon.expiresAt).toLocaleDateString("fa-IR")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${coupon.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {coupon.isActive ? "فعال" : "غیرفعال"}
                </span>
                <button onClick={() => handleDelete(coupon.id)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
