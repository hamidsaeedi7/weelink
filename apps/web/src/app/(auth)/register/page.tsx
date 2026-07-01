"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [phone, setPhone]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phone || !/^09[0-9]{9}$/.test(phone)) {
      setError("شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.data?.message || json.message || "خطا در ثبت‌نام");
      }

      toast.success("کد تأیید ارسال شد");
      window.location.href = `/verify?phone=${encodeURIComponent(phone)}`;
    } catch (e: any) {
      const msg = e.message || "خطا در ثبت‌نام";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-white dark:bg-[#0A0A0F] bg-dot-pattern px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: "var(--accent-glow)" }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-50"
           style={{ background: "var(--accent-glow)" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <img src="/weeelink.png" alt="ویلینک"
              className="w-10 h-10 rounded-2xl group-hover:scale-105 transition-transform" />
            <span className="font-black text-2xl text-gray-900 dark:text-white">
              وی<span className="text-accent">لینک</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-black text-gray-900 dark:text-white">
            ایجاد حساب رایگان
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            بدون کارت اعتباری — برای همیشه رایگان
          </p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شماره موبایل
              </label>
              <div className="relative">
                <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="input-base pr-10 text-left"
                  dir="ltr"
                  inputMode="numeric"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ارسال...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ارسال کد تأیید
                  <ArrowLeft className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            حساب دارید؟{" "}
            <Link href="/login" className="text-accent hover:opacity-80 font-medium transition-opacity">
              وارد شوید
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          با ثبت‌نام،{" "}
          <Link href="/terms" className="underline hover:text-accent transition-colors">قوانین استفاده</Link>
          {" "}و{" "}
          <Link href="/privacy" className="underline hover:text-accent transition-colors">حریم خصوصی</Link>
          {" "}را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}
