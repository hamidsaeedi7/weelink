"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, Zap, X, Clock, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import { uploadApi } from "@/lib/api";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const EMPTY = {
  title: "",
  description: "",
  originalPrice: "",
  salePrice: "",
  imageUrl: "",
  endsAt: "",
  isActive: true,
};

function Countdown({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (left <= 0) return <span className="text-red-400 text-xs">منقضی شده</span>;

  const s = Math.floor(left / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  const pad = (n: number) => toPersianNumber(String(n).padStart(2, "0"));

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      {d > 0 && <><span className="text-accent-400 font-bold">{toPersianNumber(d)}</span><span className="text-gray-400">روز</span></>}
      <span className="text-accent-400 font-bold">{pad(h % 24)}</span><span className="text-gray-400">:</span>
      <span className="text-accent-400 font-bold">{pad(m % 60)}</span><span className="text-gray-400">:</span>
      <span className="text-accent-400 font-bold">{pad(s % 60)}</span>
    </div>
  );
}

function discount(original: string, sale: string) {
  const o = Number(original); const s = Number(sale);
  if (!o || !s || s >= o) return null;
  return Math.round((1 - s / o) * 100);
}

export default function FlashSalePage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(EMPTY);
  const [endsDate, setEndsDate] = useState("");   // ISO yyyy-mm-dd (شمسی از پیکر)
  const [endsTime, setEndsTime] = useState("23:59"); // ساعت ۲۴ساعته
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const resetForm = () => { setForm(EMPTY); setEndsDate(""); setEndsTime("23:59"); };

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/flash-sales`, { headers: auth() });
      const d = await r.json();
      setSales(d.data || d || []);
    } catch { setSales([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title) { toast.error("عنوان الزامی است"); return; }
    if (!endsDate) { toast.error("تاریخ پایان را انتخاب کنید"); return; }
    if (!form.salePrice || !form.originalPrice) { toast.error("قیمت‌ها الزامی هستند"); return; }
    const endsAt = new Date(`${endsDate}T${endsTime || "23:59"}:00`).toISOString();
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/v1/flash-sales`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, endsAt }),
      });
      if (!r.ok) throw new Error();
      toast.success("فلش سیل ایجاد شد");
      setShowForm(false);
      resetForm();
      load();
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const toggle = async (id: string, isActive: boolean) => {
    await fetch(`${API}/api/v1/flash-sales/${id}`, {
      method: "PUT",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setSales((p) => p.map((s) => s.id === id ? { ...s, isActive: !isActive } : s));
  };

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await fetch(`${API}/api/v1/flash-sales/${id}`, { method: "DELETE", headers: auth() });
    setSales((p) => p.filter((s) => s.id !== id));
    toast.success("حذف شد");
  };

  const uploadImage = async (file: File) => {
    setImageUploading(true);
    try {
      const url = await uploadApi.image(file);
      setForm((p: any) => ({ ...p, imageUrl: url }));
    } catch { toast.error("خطا در آپلود"); }
    finally { setImageUploading(false); }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent-500" />
            فلش سیل
          </h1>
          <p className="text-sm text-gray-500">فروش ویژه با تایمر شمارش معکوس</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 py-2.5 px-4">
          <Plus className="w-4 h-4" /> فلش سیل جدید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
      ) : sales.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Zap className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">هنوز فلش سیلی تنظیم نکرده‌اید</p>
          <p className="text-xs text-gray-400">فلش سیل در صفحه بیوی شما با تایمر شمارش معکوس نمایش داده می‌شود</p>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary py-2 px-4 text-sm mx-auto flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> اولین فلش سیل را بسازید
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((s) => {
            const disc = discount(s.originalPrice, s.salePrice);
            const expired = new Date(s.endsAt) <= new Date();
            return (
              <div key={s.id} className={`glass-card p-4 flex gap-4 items-start ${!s.isActive || expired ? "opacity-60" : ""}`}>
                {s.imageUrl && (
                  <img src={s.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{s.title}</h3>
                    {disc && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold shrink-0">
                        {toPersianNumber(disc)}٪ تخفیف
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 line-through">{formatPrice(Number(s.originalPrice))}</span>
                    <span className="text-accent-500 font-black">{formatPrice(Number(s.salePrice))}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                    <Clock className="w-3 h-3 shrink-0" />
                    {expired ? (
                      <span className="text-xs text-red-400">منقضی شده</span>
                    ) : (
                      <Countdown endsAt={s.endsAt} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle(s.id, s.isActive)} className="text-gray-400 hover:text-accent-500 transition-colors">
                    {s.isActive ? <ToggleRight className="w-5 h-5 text-accent-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-100 dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10
                          w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-500" /> فلش سیل جدید
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان *</label>
                <input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  className="input-base" placeholder="مثال: تخفیف ویژه آخر هفته" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">توضیح</label>
                <input value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  className="input-base" placeholder="توضیح اختیاری..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">قیمت اصلی (تومان) *</label>
                  <input type="number" value={form.originalPrice}
                    onChange={(e) => setForm((p: any) => ({ ...p, originalPrice: e.target.value }))}
                    className="input-base" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">قیمت با تخفیف *</label>
                  <input type="number" value={form.salePrice}
                    onChange={(e) => setForm((p: any) => ({ ...p, salePrice: e.target.value }))}
                    className="input-base" placeholder="350000" />
                </div>
              </div>

              {form.originalPrice && form.salePrice && (
                (() => {
                  const d = discount(form.originalPrice, form.salePrice);
                  if (!d) return null;
                  return (
                    <div className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-600 dark:text-green-400">
                      ✓ {toPersianNumber(d)}٪ تخفیف —
                      معادل {formatPrice(Number(form.originalPrice) - Number(form.salePrice))} صرفه‌جویی
                    </div>
                  );
                })()
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">پایان فروش *</label>
                <div className="grid grid-cols-2 gap-2">
                  <JalaliDatePicker value={endsDate} onChange={setEndsDate} placeholder="تاریخ (شمسی)" minToday />
                  <input type="time" value={endsTime} onChange={(e) => setEndsTime(e.target.value)}
                    className="input-base text-center" dir="ltr" step={60} />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">تاریخ را از تقویم شمسی و ساعت را به‌صورت ۲۴ساعته انتخاب کنید</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تصویر محصول</label>
                {form.imageUrl ? (
                  <div className="relative w-full h-28">
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button onClick={() => setForm((p: any) => ({ ...p, imageUrl: "" }))}
                      className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imageRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4
                               text-center text-sm text-gray-400 hover:border-accent-500/50 transition-colors">
                    {imageUploading
                      ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      : <><Upload className="w-5 h-5 mx-auto mb-1" /> آپلود تصویر</>}
                  </button>
                )}
                <input ref={imageRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "در حال ذخیره..." : "ایجاد فلش سیل"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500">
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
