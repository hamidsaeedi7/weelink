"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle, Loader2, ShoppingCart, User, Phone, MapPin, FileText } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function OrderFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    description: "",
    qty: "1",
    note: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.customerName.trim()) { setError("نام و نام خانوادگی را وارد کنید"); return; }
    if (!/^09[0-9]{9}$/.test(form.customerPhone)) { setError("شماره موبایل معتبر وارد کنید (مثال: 09123456789)"); return; }
    if (!form.description.trim()) { setError("محصول یا درخواست خود را توضیح دهید"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: slug,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerAddress: form.customerAddress,
          note: form.note,
          items: [{
            productId: "custom",
            name: form.description || "سفارش آزاد",
            price: 0,
            qty: parseInt(form.qty) || 1,
          }],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "خطا در ثبت سفارش");
      setOrderNumber(json.data?.orderNumber || json.data?.id || "");
      setStep("success");
    } catch (err: any) {
      setError(err.message || "خطا در ثبت سفارش. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A0A0F] to-[#111122] px-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 border border-green-500/30
                          flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">سفارش ثبت شد!</h1>
            <p className="text-gray-400 mt-2">
              فروشنده به‌زودی با شما تماس می‌گیرد
            </p>
            {orderNumber && (
              <p className="mt-3 text-sm text-gray-500">
                شماره سفارش: <span className="text-white font-mono font-bold">{orderNumber}</span>
              </p>
            )}
          </div>
          <Link href={`/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors">
            <ArrowRight className="w-4 h-4" />
            بازگشت به صفحه فروشگاه
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0F] to-[#111122] px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href={`/${slug}`}
            className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-400" />
              ثبت سفارش آنلاین
            </h1>
            <p className="text-xs text-gray-500">اطلاعات خود را وارد کنید</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              نام و نام خانوادگی *
            </label>
            <div className="relative">
              <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                placeholder="علی رضایی"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder:text-gray-600
                           focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              شماره موبایل *
            </label>
            <div className="relative">
              <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                name="customerPhone"
                value={form.customerPhone}
                onChange={handleChange}
                type="tel"
                placeholder="09123456789"
                dir="ltr"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder:text-gray-600 text-left
                           focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              محصول / درخواست شما *
            </label>
            <div className="relative">
              <FileText className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="مثلاً: کفش کتانی سایز ۴۲ رنگ مشکی، مدل Nike"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder:text-gray-600 resize-none
                           focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {/* Qty */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">تعداد</label>
            <input
              name="qty"
              value={form.qty}
              onChange={handleChange}
              type="number"
              min="1"
              max="99"
              dir="ltr"
              className="w-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white text-center
                         focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              آدرس (اختیاری)
            </label>
            <div className="relative">
              <MapPin className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <textarea
                name="customerAddress"
                value={form.customerAddress}
                onChange={handleChange}
                rows={2}
                placeholder="تهران، خیابان ..."
                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                           text-white placeholder:text-gray-600 resize-none
                           focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              توضیحات اضافه (اختیاری)
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
              placeholder="هرگونه توضیح یا درخواست خاص ..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder:text-gray-600 resize-none
                         focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all
                       bg-orange-500 hover:bg-orange-400 active:scale-[0.98]
                       shadow-[0_4px_20px_rgba(249,115,22,0.35)]
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ثبت...
              </span>
            ) : (
              "ثبت سفارش"
            )}
          </button>

          <p className="text-center text-xs text-gray-600">
            پس از ثبت، فروشنده با شماره موبایل شما تماس می‌گیرد
          </p>
        </form>

        {/* Badge */}
        <div className="mt-10 text-center">
          <a href="/" className="text-xs text-gray-600 hover:text-orange-400 transition-colors">
            ساخته شده با <span className="font-bold">ویلینک</span>
          </a>
        </div>
      </div>
    </div>
  );
}
