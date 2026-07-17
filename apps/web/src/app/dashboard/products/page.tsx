"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, Package, ImagePlus, X, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import axios from "axios";
import { formatPrice } from "@/lib/utils";
import { uploadApi } from "@/lib/api";
import { ShareBar } from "@/components/ShareBar";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  images: string[];
  stock: number;
  weight?: number;
  prepTime?: string;
  type: "PHYSICAL" | "DIGITAL";
  isAvailable: boolean;
  paymentMethod: "CARD_TO_CARD" | "GATEWAY";
}

const CATEGORIES = PRODUCT_CATEGORIES;

const EMPTY: Partial<Product> = { type: "PHYSICAL", images: [], stock: 1, isAvailable: true, category: "", paymentMethod: "CARD_TO_CARD" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formImages, setFormImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/api/v1/products`, { headers: authHeaders() });
      setProducts(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  };

  const [slug, setSlug] = useState("");
  useEffect(() => {
    load();
    axios.get(`${API}/api/v1/me/shop`, { headers: authHeaders() })
      .then((r) => setSlug((r.data?.data ?? r.data)?.slug || "")).catch(() => {});
  }, []);

  const openNew = () => {
    reset(EMPTY);
    setFormImages([]);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    reset(p);
    setFormImages(p.images || []);
    setEditing(p);
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadApi.image(file);
      setFormImages((prev) => [...prev, url]);
    } catch { toast.error("خطا در آپلود"); }
    finally { setUploading(false); }
  };

  const onSubmit = async (form: any) => {
    if (!form.name?.trim()) { toast.error("نام محصول را وارد کنید"); return; }
    if (!form.category) { toast.error("دسته محصول را انتخاب کنید"); return; }
    if (form.price === undefined || form.price === "" || Number(form.price) < 0) { toast.error("قیمت محصول را وارد کنید"); return; }
    if (!form.paymentMethod) { toast.error("روش پرداخت را انتخاب کنید"); return; }
    const payload: any = {
      name: form.name,
      description: form.description || "",
      category: form.category,
      type: "PHYSICAL",
      images: formImages,
      price: Number(form.price),
      stock: Number(form.stock ?? 1),
      isAvailable: form.isAvailable ?? true,
      prepTime: form.prepTime || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      paymentMethod: form.paymentMethod || "CARD_TO_CARD",
    };
    try {
      if (editing) {
        const { data } = await axios.put(`${API}/api/v1/products/${editing.id}`, payload, { headers: authHeaders() });
        setProducts((prev) => prev.map((p) => p.id === editing.id ? (data.data || data) : p));
        toast.success("ویرایش شد");
      } else {
        const { data } = await axios.post(`${API}/api/v1/products`, payload, { headers: authHeaders() });
        setProducts((prev) => [...prev, data.data || data]);
        toast.success("محصول اضافه شد");
      }
      setShowForm(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "خطا");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("محصول حذف شود؟")) return;
    try {
      await axios.delete(`${API}/api/v1/products/${id}`, { headers: authHeaders() });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
  };

  const toggleAvailable = async (p: Product) => {
    try {
      await axios.put(`${API}/api/v1/products/${p.id}`, { isAvailable: !p.isAvailable }, { headers: authHeaders() });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isAvailable: !x.isAvailable } : x));
    } catch { toast.error("خطا"); }
  };

  if (loading) return <div className="flex justify-center h-48 items-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>;

  return (
    <div className="space-y-6">
      {/* موبایل: عنوان وسط بالا، زیرش توضیح، بعد سه دکمه هم‌تراز در یک ردیف.
          دسکتاپ: عنوان سمت راست، دکمه‌ها سمت چپ. */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3">
        <div className="text-center sm:text-right">
          <h1 className="text-xl font-black text-gray-900 dark:text-white">محصولات فیزیکی</h1>
          <p className="text-sm text-gray-500">لینک فروشگاه را برای مشتری بفرستید — {products.length} محصول</p>
        </div>
        <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2">
          {slug && <ShareBar url={`https://weeelink.ir/${slug}/shop`} text="فروشگاه من" />}
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 text-white font-bold text-sm hover:bg-accent-400 transition-all shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
            <Plus className="w-4 h-4" />
            محصول جدید
          </button>
        </div>
      </div>

      {/* Product list */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-3">
          <Package className="w-12 h-12 mx-auto opacity-20" />
          <p>هنوز محصولی ندارید</p>
          <button onClick={openNew} className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-bold">
            افزودن اولین محصول
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id}
              className="bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
              <div className="aspect-video bg-gray-50 dark:bg-white/5 relative">
                {p.images[0]
                  ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-8 h-8" /></div>}
                <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${p.isAvailable ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                  {p.isAvailable ? "موجود" : "ناموجود"}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">{p.name}</h3>
                <p className="text-accent-500 font-black text-sm mb-3">{formatPrice(p.price)}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-xs hover:border-accent-500/40 hover:text-accent-500 transition-all flex items-center justify-center gap-1">
                    <Pencil className="w-3 h-3" />
                    ویرایش
                  </button>
                  <button onClick={() => toggleAvailable(p)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:border-accent-500/40 transition-all">
                    {p.isAvailable ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-red-500/20 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-gray-100 dark:bg-[#111] rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-black text-gray-900 dark:text-white">
                {editing ? "ویرایش محصول" : "محصول جدید"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">تصاویر</label>
                  <div className="flex gap-2 flex-wrap">
                    {formImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button type="button"
                          onClick={() => setFormImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/20
                                 flex items-center justify-center text-gray-400 hover:border-accent-500/40 transition-all">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    </button>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400 text-left">سایز مناسب: ۸۰۰×۸۰۰ پیکسل (مربعی)</p>
                </div>

                <input {...register("name")}
                  placeholder="نام محصول *" className="input-base" />

                <textarea {...register("description")} rows={2}
                  placeholder="توضیحات" className="input-base resize-none" />

                {/* دسته محصول (اجباری) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">دسته محصول *</label>
                  <select {...register("category")}
                    className="input-base bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                    <option value="" className="bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">انتخاب دسته...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">قیمت (تومان) *</label>
                    <input {...register("price")}
                      type="number" placeholder="۲۵۰۰۰۰" className="input-base" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">موجودی</label>
                    <input {...register("stock")}
                      type="number" placeholder="۱" className="input-base" />
                  </div>
                </div>

                {/* روش پرداخت — الزامی، هنگام ساخت محصول انتخاب می‌شود */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">روش پرداخت *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "CARD_TO_CARD", l: "کارت به کارت" },
                      { v: "GATEWAY", l: "درگاه پرداخت ویلینک" },
                    ].map((o) => (
                      <label key={o.v}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-all ${
                          watch("paymentMethod") === o.v
                            ? "border-accent-500 bg-accent-500/10 text-accent-500 font-bold"
                            : "border-gray-200 dark:border-white/10 text-gray-500"
                        }`}>
                        <input type="radio" value={o.v} {...register("paymentMethod")} className="hidden" />
                        {o.l}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    کارت‌به‌کارت یعنی خریدار مستقیم به کارت شما واریز می‌کند و باید پرداخت را دستی تأیید کنید. درگاه ویلینک یعنی پرداخت آنلاین با کارمزد ۱۰٪ و واریز خودکار به حساب شما.
                  </p>
                </div>

                {/* اطلاعات ارسال */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 space-y-3">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">اطلاعات ارسال</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">وزن محصول (گرم)</label>
                      <input {...register("weight")} type="number" placeholder="۵۰۰" className="input-base" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">زمان آماده‌سازی ارسال</label>
                      <input {...register("prepTime")} type="text" placeholder="۱ تا ۳ روز کاری" className="input-base" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-bold">
                    انصراف
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-accent-500 text-white text-sm font-bold hover:bg-accent-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {editing ? "ذخیره" : "افزودن"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
