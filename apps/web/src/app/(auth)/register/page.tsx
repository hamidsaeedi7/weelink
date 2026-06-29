"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [mode, setMode]         = useState<"phone" | "email">("phone");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const [phone, setPhone]       = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "phone") {
      if (!phone || !/^09[0-9]{9}$/.test(phone)) {
        setError("شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
        return;
      }
    } else {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("ایمیل معتبر وارد کنید");
        return;
      }
      if (!password || password.length < 8) {
        setError("رمز عبور باید حداقل ۸ کاراکتر باشد");
        return;
      }
    }

    setLoading(true);
    try {
      const body = mode === "phone"
        ? { phone }
        : { email, password };

      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.data?.message || json.message || "خطا در ثبت‌نام");
      }

      if (mode === "phone") {
        toast.success("کد تأیید ارسال شد");
        window.location.href = `/verify?phone=${encodeURIComponent(phone)}`;
      } else {
        if (json.data?.accessToken) {
          localStorage.setItem("access_token", json.data.accessToken);
        }
        if (json.data?.refreshToken) {
          localStorage.setItem("refresh_token", json.data.refreshToken);
        }
        toast.success("ثبت‌نام موفق! در حال ورود...");
        window.location.href = "/dashboard";
      }
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
            <img src="/weeelink.svg" alt="ویلینک"
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
          {/* Mode Toggle */}
          <div className="flex p-1 gap-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            {[
              { id: "phone" as const, label: "موبایل", icon: Phone },
              { id: "email" as const, label: "ایمیل",  icon: Mail  },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setMode(id); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg
                            transition-all duration-200 font-medium
                            ${mode === id
                              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "phone" ? (
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
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ایمیل
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="you@example.com"
                      className="input-base pr-10 text-left"
                      dir="ltr"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="حداقل ۸ کاراکتر"
                      className="input-base pr-10 pl-10 text-left"
                      dir="ltr"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

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
                  {mode === "phone" ? "ارسال کد تأیید" : "ثبت‌نام"}
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
