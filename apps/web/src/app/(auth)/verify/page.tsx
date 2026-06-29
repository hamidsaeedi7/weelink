"use client";

import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";

function VerifyForm() {
  const params = useSearchParams();
  const phone = params.get("phone") || "";
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(120);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d) && next.join("").length === 6) {
      submit(next.join(""));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const submit = async (code: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      localStorage.setItem("access_token", json.data.accessToken);
      toast.success("تأیید موفق! خوش آمدید.");
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.message || "کد اشتباه است");
      setDigits(["", "", "", "", "", ""]);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    try {
      await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setResendIn(120);
      toast.success("کد مجدداً ارسال شد");
    } catch {
      toast.error("خطا در ارسال مجدد");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gray-50 dark:bg-[#0A0A0F] px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96
                        bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center">
              <span className="text-white font-black">W</span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-black text-gray-900 dark:text-white">تأیید شماره موبایل</h1>
          <p className="mt-2 text-sm text-gray-500">
            کد ۶ رقمی به{" "}
            <span className="font-mono text-orange-500 dir-ltr">{phone}</span>
            {" "}ارسال شد
          </p>
        </div>

        <div className="glass-card p-8 space-y-8">
          {/* OTP Input */}
          <div className="flex gap-2 justify-center" dir="ltr">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2
                            bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white
                            transition-all outline-none
                            ${d
                              ? "border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
                              : "border-gray-200 dark:border-white/10 focus:border-orange-500/50"}`}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => submit(digits.join(""))}
            className="btn-primary w-full py-3.5 disabled:opacity-60">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                در حال تأیید...
              </span>
            ) : (
              <>تأیید و ورود<ArrowLeft className="w-4 h-4" /></>
            )}
          </button>

          <div className="text-center">
            <button onClick={resend} disabled={resendIn > 0}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              {resendIn > 0 ? `ارسال مجدد (${resendIn}ث)` : "ارسال مجدد کد"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
