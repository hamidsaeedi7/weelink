"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Phone, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Form = { email?: string; phone?: string; password: string };

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      localStorage.setItem("access_token", json.data.accessToken);
      localStorage.setItem("refresh_token", json.data.refreshToken);
      toast.success("خوش آمدید!");
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast.error(e.message || "اطلاعات ورود اشتباه است");
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
            <img src="/weeelink.svg" alt="ویلینک"
              className="w-10 h-10 rounded-2xl group-hover:scale-105 transition-transform" />
            <span className="font-black text-2xl text-gray-900 dark:text-white">
              وی<span className="text-accent">لینک</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-black text-gray-900 dark:text-white">ورود به حساب</h1>
          <p className="mt-2 text-sm text-gray-500">خوش برگشتی!</p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* Mode */}
          <div className="flex p-1 gap-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            {[
              { id: "email", label: "ایمیل", icon: Mail },
              { id: "phone", label: "OTP موبایل", icon: Phone },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button"
                onClick={() => setMode(id as "email" | "phone")}
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {mode === "email" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ایمیل</label>
                  <div className="relative">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input {...register("email")} type="email" placeholder="you@example.com"
                      className="input-base pr-10 text-left" dir="ltr" required />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">رمز عبور</label>
                    <Link href="/forgot-password" className="text-xs text-accent hover:opacity-80 transition-opacity">
                      فراموشی رمز؟
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input {...register("password")} type={showPass ? "text" : "password"}
                      placeholder="رمز عبور" className="input-base pr-10 pl-10 text-left" dir="ltr" required />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شماره موبایل
                </label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register("phone")} type="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="input-base pr-10 text-left" dir="ltr" required />
                </div>
                <p className="mt-2 text-xs text-gray-500">کد یک‌بار مصرف ارسال می‌شود</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ورود...
                </span>
              ) : (
                <>{mode === "email" ? "ورود" : "ارسال کد"}<ArrowLeft className="w-4 h-4" /></>
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
