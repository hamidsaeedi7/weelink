"use client";

import Link from "next/link";
import { useState } from "react";
import { Phone, Lock, ArrowLeft, Eye, EyeOff, KeyRound, MessageSquare, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  // Field-level errors sit under the input they belong to; `formError` is
  // only for failures that aren't about a single field (bad credentials,
  // network). Previously every error landed in one box at the bottom, so the
  // user had to work out which input to fix.
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const validPhone = /^09[0-9]{9}$/.test(phone);
  const clearErrors = () => { setPhoneError(""); setPasswordError(""); setFormError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!validPhone) {
      setPhoneError("شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
      return;
    }
    if (mode === "password" && !password.trim()) {
      setPasswordError("رمز عبور را وارد کنید");
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
      setFormError(msg);
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
            <img src="/weeelink.png?v=8" alt="ویلینک"
              className="w-10 h-10 rounded-2xl group-hover:scale-105 transition-transform" />
            <span className="font-black text-2xl text-gray-900 dark:text-white">
              وی<span className="text-accent">لینک</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-black text-gray-900 dark:text-white">ورود به حساب</h1>
          <p className="mt-2 text-base text-gray-700 dark:text-gray-300">خوش برگشتی!</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* روش ورود */}
          <div role="tablist" aria-label="روش ورود" className="flex p-1 gap-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            {[
              { id: "password", label: "رمز عبور", icon: KeyRound },
              { id: "otp", label: "کد یک‌بار مصرف", icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id}
                onClick={() => { setMode(id as "password" | "otp"); clearErrors(); }}
                className={`flex-1 flex items-center justify-center gap-2 min-h-[var(--tap-target)] px-2 text-sm rounded-lg
                            transition-all font-medium
                            ${mode === id
                              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}>
                <Icon aria-hidden="true" className="icon-sm" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
                شماره موبایل
              </label>
              <div className="relative">
                <Phone aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 icon-sm text-gray-500 dark:text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearErrors(); }}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className={`input-base pr-10 text-left text-base ${phoneError ? "!border-red-500 focus:!border-red-500" : ""}`}
                  dir="ltr"
                  inputMode="numeric"
                  autoFocus
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error" : undefined}
                />
              </div>
              {phoneError && (
                <p id="phone-error" role="alert" className="flex items-center gap-1.5 mt-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle aria-hidden="true" className="icon-sm shrink-0" />
                  {phoneError}
                </p>
              )}
            </div>

            {mode === "password" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="text-sm font-bold text-gray-800 dark:text-gray-200">رمز عبور</label>
                  <Link href="/forgot-password" className="text-sm text-accent hover:opacity-80 transition-opacity">
                    فراموشی رمز؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 icon-sm text-gray-500 dark:text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                    placeholder="رمز عبور"
                    className={`input-base pr-10 pl-12 text-left text-base ${passwordError ? "!border-red-500 focus:!border-red-500" : ""}`}
                    dir="ltr"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? "password-error" : undefined}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                    aria-pressed={showPass}
                    className="absolute left-1 top-1/2 -translate-y-1/2 tap-target inline-flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100">
                    {showPass ? <EyeOff aria-hidden="true" className="icon-sm" /> : <Eye aria-hidden="true" className="icon-sm" />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" role="alert" className="flex items-center gap-1.5 mt-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle aria-hidden="true" className="icon-sm shrink-0" />
                    {passwordError}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                کد یک‌بار مصرف به این شماره پیامک می‌شود
              </p>
            )}

            {formError && (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-500/5 border border-red-500/30 px-3 py-2.5 rounded-lg">
                <AlertCircle aria-hidden="true" className="icon-sm shrink-0" />
                {formError}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  {mode === "password" ? "در حال ورود..." : "در حال ارسال..."}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {mode === "password" ? "ورود" : "ارسال کد"}
                  <ArrowLeft aria-hidden="true" className="icon-sm" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-700 dark:text-gray-300">
            حساب ندارید؟{" "}
            <Link href="/register" className="text-accent hover:opacity-80 font-bold transition-opacity">
              ثبت‌نام رایگان
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
