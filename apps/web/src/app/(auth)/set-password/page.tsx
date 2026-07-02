"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("رمز عبور حداقل ۸ کاراکتر باشد");
      return;
    }
    if (password !== confirm) {
      setError("تکرار رمز عبور یکسان نیست");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.data?.message || json.message || "خطا در تنظیم رمز");
      toast.success("رمز عبور تنظیم شد!");
      window.location.href = "/dashboard";
    } catch (e: any) {
      const msg = e.message || "خطا در تنظیم رمز";
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
            <ShieldCheck className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-gray-900 dark:text-white">
            تنظیم رمز عبور
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            با تنظیم رمز، دفعه بعد می‌توانید بدون پیامک هم وارد شوید
          </p>
        </div>

        <div className="glass-card p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoFocus
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تکرار رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="تکرار رمز"
                  className="input-base pr-10 text-left"
                  dir="ltr"
                  required
                  minLength={8}
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
                  در حال ذخیره...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  ذخیره و ادامه
                  <ArrowLeft className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              فعلاً رد شدن — بعداً از تنظیمات حساب
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
