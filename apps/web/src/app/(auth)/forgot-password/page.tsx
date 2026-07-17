"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Phone, Lock, ArrowLeft, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    if (!/^09[0-9]{9}$/.test(phone)) {
      setError("شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۳۴۵۶۷۸۹)");
      return false;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.data?.message || json.message || "خطا در ارسال کد");
      toast.success("کد بازیابی ارسال شد");
      setResendIn(120);
      return true;
    } catch (e: any) {
      const msg = e.message || "خطا در ارسال کد";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (await sendCode()) setStep("reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (code.length !== 6) {
      setError("کد ۶ رقمی را وارد کنید");
      return;
    }
    if (newPassword.length < 8) {
      setError("رمز عبور حداقل ۸ کاراکتر باشد");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: phone, code, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.data?.message || json.message || "خطا در تغییر رمز");
      toast.success("رمز عبور تغییر کرد! حالا وارد شوید");
      window.location.href = "/login";
    } catch (e: any) {
      const msg = e.message || "خطا در تغییر رمز";
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-orange-500/10 border border-orange-500/20 mb-2">
            <KeyRound className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-gray-900 dark:text-white">
            بازیابی رمز عبور
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === "phone"
              ? "شماره موبایل حساب خود را وارد کنید"
              : `کد ارسال‌شده به ${phone} و رمز جدید را وارد کنید`}
          </p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
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
                className="btn-primary w-full py-3.5 disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    در حال ارسال...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ارسال کد بازیابی
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  کد ۶ رقمی
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="______"
                  className="input-base text-center tracking-[0.5em] font-bold"
                  dir="ltr"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  رمز عبور جدید
                </label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="حداقل ۸ کاراکتر"
                    className="input-base pr-10 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

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
                    در حال تغییر رمز...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    تغییر رمز عبور
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                )}
              </button>

              <div className="text-center">
                <button type="button" onClick={sendCode} disabled={resendIn > 0 || loading}
                  className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500
                             disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendIn > 0 ? `ارسال مجدد (${resendIn}ث)` : "ارسال مجدد کد"}
                </button>
              </div>
            </form>
          )}

          <div className="text-center text-sm text-gray-500">
            <Link href="/login" className="text-accent hover:opacity-80 font-medium transition-opacity">
              بازگشت به ورود
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
