"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, User, Lock, Shield, Crown, Search } from "lucide-react";
import { accountApi } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profile" | "password" | "security" | "seo">("profile");
  const [seo, setSeo] = useState({ metaTitle: "", metaDesc: "", ogImage: "" });
  const [seoSaving, setSeoSaving] = useState(false);

  const profileForm = useForm();
  const passForm = useForm();

  useEffect(() => {
    (accountApi.getMe() as Promise<any>).then((data) => {
      setUser(data);
      profileForm.reset({ phone: data.phone || "" });
    }).finally(() => setLoading(false));
    // Load SEO settings from shop
    fetch(`${API}/api/v1/me/shop`, { headers: authH() }).then(r => r.json()).then(d => {
      const shop = d.data || d;
      if (shop?.metaTitle || shop?.metaDesc) {
        setSeo({ metaTitle: shop.metaTitle || "", metaDesc: shop.metaDesc || "", ogImage: shop.ogImage || "" });
      }
    }).catch(() => {});
  }, []);

  const onProfileSave = async (data: any) => {
    try {
      const updated = await accountApi.updateProfile(data) as any;
      setUser((u: any) => ({ ...u, ...updated }));
      toast.success("پروفایل بروز شد");
    } catch (e: any) {
      toast.error(e?.message || "خطا");
    }
  };

  const onPasswordChange = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("رمزهای جدید یکسان نیستند");
      return;
    }
    try {
      await accountApi.changePassword(data.oldPassword, data.newPassword);
      toast.success("رمز عبور تغییر یافت");
      passForm.reset();
    } catch (e: any) {
      toast.error(e?.message || "رمز عبور فعلی اشتباه است");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );

  const saveSeo = async () => {
    setSeoSaving(true);
    try {
      await fetch(`${API}/api/v1/me/shop`, {
        method: "PUT",
        headers: { ...authH(), "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      toast.success("تنظیمات SEO ذخیره شد");
    } catch { toast.error("خطا"); }
    finally { setSeoSaving(false); }
  };

  const TABS = [
    { key: "profile", label: "پروفایل", icon: User },
    { key: "seo", label: "SEO", icon: Search },
    { key: "password", label: "رمز عبور", icon: Lock },
    { key: "security", label: "امنیت", icon: Shield },
  ] as const;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">تنظیمات حساب</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-gray-500" dir="ltr">{user?.phone}</span>
          {user?.plan === "PRO" && (
            <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold">
              <Crown className="w-3 h-3" />
              PRO
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.key
                ? "bg-white dark:bg-white/10 text-orange-500 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
          <form onSubmit={profileForm.handleSubmit(onProfileSave)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شماره موبایل
              </label>
              <input {...profileForm.register("phone")}
                type="tel" dir="ltr"
                placeholder="09xxxxxxxxx"
                className="input-base" />
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500">تاریخ عضویت</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("fa-IR")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500">آخرین ورود</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString("fa-IR")
                    : "—"}
                </span>
              </div>
            </div>
            <button type="submit" disabled={profileForm.formState.isSubmitting}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                         bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm
                         transition-all disabled:opacity-60 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              {profileForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              ذخیره تغییرات
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {tab === "password" && (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
          <form onSubmit={passForm.handleSubmit(onPasswordChange)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رمز عبور فعلی
              </label>
              <input {...passForm.register("oldPassword", { required: true })}
                type="password" dir="ltr"
                placeholder="••••••••"
                className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رمز عبور جدید
              </label>
              <input {...passForm.register("newPassword", { required: true, minLength: 6 })}
                type="password" dir="ltr"
                placeholder="حداقل ۶ کاراکتر"
                className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تکرار رمز عبور جدید
              </label>
              <input {...passForm.register("confirmPassword", { required: true })}
                type="password" dir="ltr"
                placeholder="••••••••"
                className="input-base" />
            </div>
            <button type="submit" disabled={passForm.formState.isSubmitting}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                         bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm
                         transition-all disabled:opacity-60">
              {passForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              تغییر رمز عبور
            </button>
          </form>
        </div>
      )}

      {/* SEO Tab */}
      {tab === "seo" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white mb-1">تنظیمات SEO صفحه</h2>
              <p className="text-xs text-gray-500">این اطلاعات در نتایج گوگل و پیش‌نمایش شبکه‌های اجتماعی نمایش داده می‌شوند</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                عنوان صفحه (Meta Title)
              </label>
              <input value={seo.metaTitle} onChange={(e) => setSeo(p => ({ ...p, metaTitle: e.target.value }))}
                className="input-base" placeholder="مثال: علی رضایی — مربی فیتنس" maxLength={60} />
              <p className="text-[11px] text-gray-400 mt-1">{seo.metaTitle.length}/60 کاراکتر</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                توضیحات صفحه (Meta Description)
              </label>
              <textarea value={seo.metaDesc} onChange={(e) => setSeo(p => ({ ...p, metaDesc: e.target.value }))}
                className="input-base resize-none h-24" placeholder="توضیح کوتاهی که در گوگل نمایش داده می‌شود..." maxLength={160} />
              <p className="text-[11px] text-gray-400 mt-1">{seo.metaDesc.length}/160 کاراکتر</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                تصویر اشتراک‌گذاری (OG Image URL)
              </label>
              <input value={seo.ogImage} onChange={(e) => setSeo(p => ({ ...p, ogImage: e.target.value }))}
                className="input-base" placeholder="https://..." dir="ltr" />
              <p className="text-[11px] text-gray-400 mt-1">تصویری که در تلگرام، واتساپ و... نمایش داده می‌شود (1200×630 پیکسل توصیه می‌شود)</p>
            </div>
            {seo.ogImage && (
              <img src={seo.ogImage} alt="OG Preview"
                className="w-full h-36 object-cover rounded-xl border border-gray-200 dark:border-white/10" />
            )}
            <button onClick={saveSeo} disabled={seoSaving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {seoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              ذخیره تنظیمات SEO
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white">وضعیت امنیتی</h2>
            <div className="space-y-3">
              {[
                { label: "شماره موبایل تأیید شده", value: !!user?.phone, ok: !!user?.phone },
                { label: "حساب فعال", value: !user?.isBlocked, ok: !user?.isBlocked },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.ok
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {item.ok ? "✓ فعال" : "✗ ناقص"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-200 dark:border-red-500/20 p-5">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">خروج از همه دستگاه‌ها</h3>
            <p className="text-xs text-red-500/70 dark:text-red-400/60 mb-3">
              با این کار از تمام مرورگرها و دستگاه‌های دیگر خارج می‌شوید.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
              }}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 transition-all">
              خروج از همه جا
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
