"use client";

import { useState } from "react";
import { Lock, User, Shield } from "lucide-react";
import { toast } from "sonner";

export default function ModirLoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim()) { setError("نام کاربری یا ایمیل را وارد کنید"); return; }
    if (!form.password) { setError("رمز عبور را وارد کنید"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.username, password: form.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.data?.message || json.message || "خطا در ورود");
      const token = json.data?.accessToken;
      if (!token) throw new Error("توکن دریافت نشد");
      // Decode JWT payload to verify admin role (no secret needed to read payload)
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!["ADMIN", "SUPER_ADMIN", "WRITER"].includes(payload.role || "")) {
        throw new Error("دسترسی مجاز نیست — فقط ادمین‌ها می‌توانند وارد شوند");
      }
      localStorage.setItem("admin_token", token);
      // نویسنده فقط به وبلاگ دسترسی دارد — مستقیم همان‌جا برود
      window.location.href = payload.role === "WRITER" ? "/modir/blog" : "/modir";
    } catch (e: any) {
      toast.error(e.message || "اطلاعات ورود اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/3 rounded-full blur-2xl" />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{
               backgroundImage: "radial-gradient(circle, rgba(249,115,22,0.5) 1px, transparent 1px)",
               backgroundSize: "28px 28px",
             }} />
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
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                             text-white placeholder:text-gray-600
                             focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10
                             transition-all text-left"
                  placeholder="admin@example.com"
                  dir="ltr"
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
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10
                             text-white
                             focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10
                             transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all
                         bg-orange-500 hover:bg-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]
                         hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]
                         disabled:opacity-60 disabled:cursor-not-allowed active:scale-95">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
