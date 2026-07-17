"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, Lock, ArrowLeft, Eye, EyeOff, KeyRound, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validPhone = /^09[0-9]{9}$/.test(phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validPhone) {
      setError("شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    if (mode === "password" && !password.trim()) {
      setError("رمز عبور را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      if (mode === "password") {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.data?.message || json.message || "اطلاعات ورود اشتباه است");
        localStorage.setItem("access_token", json.data.accessToken);
        localStorage.setItem("refresh_token", json.data.refreshToken);
        toast.success("خوش آمدید!");
        window.location.href = "/dashboard";
      } else {
        const res = await fetch("/api/v1/auth/login-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.data?.message || json.message || "خطا در ارسال کد");
        toast.success("کد ورود ارسال شد");
        window.location.href = `/verify?phone=${encodeURIComponent(phone)}&flow=login`;
      }
    } catch (e: any) {
      const msg = e.message || "خطا در ورود";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-white dark:bg-[#0A0A0F] bg-dot-pattern px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none"
           style={{ background: "var(--accent-glow)" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <img src="/weeelink.png" alt="ویلینک"
              className="w-10 h-10 rounded-2xl group-hover:scale-105 transition-transform" />
            <span className="font-black text-2xl text-gray-900 dark:text-white">
              وی<span className="text-accent">لینک</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-black text-gray-900 dark:text-white">ورود به حساب</h1>
          <p className="mt-2 text-sm text-gray-500">خوش برگشتی!</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* روش ورود */}
          <div className="flex p-1 gap-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            {[
              { id: "password", label: "رمز عبور", icon: KeyRound },
              { id: "otp", label: "کد یک‌بار مصرف", icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button"
                onClick={() => { setMode(id as "password" | "otp"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm rounded-lg
                            transition-all font-medium
                            ${mode === id
                              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

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

            {mode === "password" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">رمز عبور</label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:opacity-80 transition-opacity">
                    فراموشی رمز؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="رمز عبور"
                    className="input-base pr-10 pl-10 text-left"
                    dir="ltr"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                کد یک‌بار مصرف به این شماره پیامک می‌شود
              </p>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "password" ? "در حال ورود..." : "در حال ارسال..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === "password" ? "ورود" : "ارسال کد"}
                  <ArrowLeft className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-500">
            حساب ندارید؟{" "}
            <Link href="/register" className="text-accent hover:opacity-80 font-medium transition-opacity">
              ثبت‌نام رایگان
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
