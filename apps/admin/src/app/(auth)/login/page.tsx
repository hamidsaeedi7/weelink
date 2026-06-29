"use client";

import { useState } from "react";
import { Lock, User, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.username, password: form.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      if (!["ADMIN", "SUPER_ADMIN"].includes(json.data?.user?.role || "")) {
        throw new Error("دسترسی مجاز نیست");
      }
      localStorage.setItem("admin_token", json.data.accessToken);
      window.location.href = "/modir";
    } catch (e: any) {
      toast.error(e.message || "اطلاعات ورود اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/3 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white">پنل مدیریت ویلینک</h1>
          <p className="text-sm text-gray-500 mt-1">فقط برای ادمین‌های مجاز</p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">نام کاربری / ایمیل</label>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="input-base pr-10 text-left bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                  placeholder="hamid"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-base pr-10 text-left bg-white/5 border-white/10 text-white"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ورود...
                </span>
              ) : "ورود به پنل مدیریت"}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-gray-700">
          ویلینک © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
