"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Tag, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { toPersianNumber } from "@/lib/utils";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const SCOPE_OPTIONS = [
  { value: "ALL", label: "همهٔ محصولات" },
  { value: "PRODUCT", label: "یک محصول فیزیکی خاص" },
  { value: "DIGITAL_FILE", label: "یک فایل دیجیتال خاص" },
  { value: "COURSE", label: "یک دورهٔ آموزشی خاص" },
  { value: "CATEGORY", label: "یک دستهٔ محصول فیزیکی" },
];

const SCOPE_LABELS: Record<string, string> = {
  ALL: "همه محصولات", PRODUCT: "محصول", DIGITAL_FILE: "فایل دیجیتال", COURSE: "دوره", CATEGORY: "دسته",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");   // ISO date from the Jalali picker
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { code: "", type: "percent", value: 10, maxUses: -1, scopeType: "ALL", scopeId: "", scopeCategory: "" },
  });
  const couponType = watch("type");
  const scopeType = watch("scopeType");

  // گزینه‌های هدف‌گذاری (فقط وقتی لازم است بارگذاری می‌شوند)
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<{ id: string; title: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/api/v1/coupons`, { headers: authHeaders() });
      setCoupons(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch { toast.error("خطا"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const h = authHeaders();
    if (scopeType === "PRODUCT" && products.length === 0) {
      axios.get(`${API}/api/v1/products`, { headers: h }).then((r) => {
        const d = r.data?.data ?? r.data;
        setProducts(Array.isArray(d) ? d : []);
      }).catch(() => {});
    }
    if (scopeType === "DIGITAL_FILE" && files.length === 0) {
      axios.get(`${API}/api/v1/digital-files`, { headers: h }).then((r) => {
        const d = r.data?.data ?? r.data;
        setFiles(Array.isArray(d) ? d : []);
      }).catch(() => {});
    }
    if (scopeType === "COURSE" && courses.length === 0) {
      axios.get(`${API}/api/v1/courses`, { headers: h }).then((r) => {
        const d = r.data?.data ?? r.data;
        setCourses(Array.isArray(d) ? d : []);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeType]);

  const onSubmit = async (form: any) => {
    if (!form.code?.trim()) { toast.error("کد تخفیف را وارد کنید"); return; }
    if (form.value === undefined || form.value === "") { toast.error("مقدار تخفیف را وارد کنید"); return; }
    const value = Number(form.value);
    if (form.type === "percent" && (value < 1 || value > 100)) {
      toast.error("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد");
      return;
    }
    if (form.scopeType !== "ALL" && form.scopeType !== "CATEGORY" && !form.scopeId) {
      toast.error("مورد هدف کد تخفیف را انتخاب کنید");
      return;
    }
    if (form.scopeType === "CATEGORY" && !form.scopeCategory) {
      toast.error("دستهٔ محصول هدف را انتخاب کنید");
      return;
    }
    // عنوان مورد هدف برای نمایش در لیست
    let scopeName = "";
    if (form.scopeType === "PRODUCT") scopeName = products.find((p) => p.id === form.scopeId)?.name || "";
    if (form.scopeType === "DIGITAL_FILE") scopeName = files.find((f) => f.id === form.scopeId)?.title || "";
    if (form.scopeType === "COURSE") scopeName = courses.find((c) => c.id === form.scopeId)?.title || "";

    try {
      const { data } = await axios.post(`${API}/api/v1/coupons`, {
        code: form.code.toUpperCase(),
        type: form.type,
        value,
        maxUses: Number(form.maxUses),
        expiresAt: expiresAt || undefined,
        scopeType: form.scopeType,
        scopeId: form.scopeType === "ALL" || form.scopeType === "CATEGORY" ? undefined : form.scopeId,
        scopeName: scopeName || undefined,
        scopeCategory: form.scopeType === "CATEGORY" ? form.scopeCategory : undefined,
      }, { headers: authHeaders() });
      setCoupons((prev) => [data.data || data, ...prev]);
      toast.success("کد تخفیف ساخته شد");
      setShowForm(false);
      setExpiresAt("");
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا در ساخت کد");
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

  if (loading) return <div className="flex justify-center h-48 items-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">کدهای تخفیف</h1>
          <p className="text-sm text-gray-500">{toPersianNumber(coupons.length)} کد</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-400 transition-all shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
          <Plus className="w-4 h-4" />
          کد جدید
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">ایجاد کد تخفیف</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-2">
              <input {...register("code")}
                placeholder="کد تخفیف (مثال: SUMMER20)" dir="ltr"
                className="input-base flex-1 uppercase tracking-widest font-mono text-sm" />
              <button type="button"
                onClick={() => {
                  const code = generateCode();
                  reset((v) => ({ ...v, code }));
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 text-xs hover:border-accent-500/40 hover:text-accent-500 transition-all">
                تولید خودکار
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select {...register("type")} className="input-base text-sm bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                <option value="percent" className="bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">درصدی</option>
                <option value="fixed" className="bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">مبلغ ثابت (تومان)</option>
              </select>
              <div className="relative">
                <input {...register("value")}
                  type="number" placeholder={couponType === "percent" ? "درصد (۱ تا ۱۰۰)" : "مبلغ (تومان)"}
                  className="input-base" />
              </div>
            </div>

            {/* هدف‌گذاری کد تخفیف */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 space-y-3">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">این کد روی چه چیزی اعمال شود؟</label>
              <select {...register("scopeType")} className="input-base text-sm bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                {SCOPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">{o.label}</option>
                ))}
              </select>

              {scopeType === "PRODUCT" && (
                <select {...register("scopeId")}
                  className="input-base text-sm bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                  <option value="" className="bg-gray-100 dark:bg-[#1a1a2e]">انتخاب محصول...</option>
                  {products.map((p) => <option key={p.id} value={p.id} className="bg-gray-100 dark:bg-[#1a1a2e]">{p.name}</option>)}
                </select>
              )}
              {scopeType === "DIGITAL_FILE" && (
                <select {...register("scopeId")}
                  className="input-base text-sm bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                  <option value="" className="bg-gray-100 dark:bg-[#1a1a2e]">انتخاب فایل...</option>
                  {files.map((f) => <option key={f.id} value={f.id} className="bg-gray-100 dark:bg-[#1a1a2e]">{f.title}</option>)}
                </select>
              )}
              {scopeType === "COURSE" && (
                <select {...register("scopeId")}
                  className="input-base text-sm bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                  <option value="" className="bg-gray-100 dark:bg-[#1a1a2e]">انتخاب دوره...</option>
                  {courses.map((c) => <option key={c.id} value={c.id} className="bg-gray-100 dark:bg-[#1a1a2e]">{c.title}</option>)}
                </select>
              )}
              {scopeType === "CATEGORY" && (
                <select {...register("scopeCategory")}
                  className="input-base text-sm bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                  <option value="" className="bg-gray-100 dark:bg-[#1a1a2e]">انتخاب دسته...</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c} className="bg-gray-100 dark:bg-[#1a1a2e]">{c}</option>)}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">حداکثر استفاده (-۱ = نامحدود)</label>
                <input {...register("maxUses")} type="number" className="input-base" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">تاریخ انقضا (اختیاری)</label>
                <JalaliDatePicker value={expiresAt} onChange={setExpiresAt} placeholder="انتخاب تاریخ شمسی" minToday />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-bold">
                انصراف
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
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
              className="flex items-center gap-4 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 px-5 py-4">
              <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                <Tag className="w-5 h-5 text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-gray-900 dark:text-white tracking-wider text-sm">
                    {coupon.code}
                  </span>
                  <button onClick={() => copyCode(coupon.code)}
                    className="text-gray-400 hover:text-accent-500 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {coupon.scopeType && coupon.scopeType !== "ALL" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold">
                      {SCOPE_LABELS[coupon.scopeType]}{coupon.scopeName ? `: ${coupon.scopeName}` : coupon.scopeCategory ? `: ${coupon.scopeCategory}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="text-accent-400 font-bold">
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
