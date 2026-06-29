"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Globe, Shield, CreditCard, Wrench, Search, Link2, CreditCard as PayIcon,
  Save, AlertTriangle, Plus, Trash2, Eye, EyeOff,
} from "lucide-react";
import { adminApi } from "@/lib/api";

type TabId = "identity" | "admin" | "plans" | "maintenance" | "seo" | "links" | "gateways";

interface Tab { id: TabId; label: string; icon: React.ReactNode }

const TABS: Tab[] = [
  { id: "identity", label: "هویت سایت", icon: <Globe size={16} /> },
  { id: "admin", label: "اطلاعات ادمین", icon: <Shield size={16} /> },
  { id: "plans", label: "قیمت پلن‌ها", icon: <CreditCard size={16} /> },
  { id: "maintenance", label: "حالت تعمیر", icon: <Wrench size={16} /> },
  { id: "seo", label: "تنظیمات SEO", icon: <Search size={16} /> },
  { id: "links", label: "مدیریت لینک‌ها", icon: <Link2 size={16} /> },
  { id: "gateways", label: "درگاه‌ها", icon: <PayIcon size={16} /> },
];

interface CustomLink { label: string; url: string; isActive: boolean }

interface Settings {
  siteName?: string;
  siteDesc?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  maintenanceMode?: boolean;
  maintenanceMsg?: string;
  seoTitle?: string;
  seoDesc?: string;
  seoKeywords?: string;
  customLinks?: CustomLink[];
  planPrices?: { monthly: number; sixMonths: number; yearly: number };
  paymentConfig?: {
    zarinpal?: { merchantId: string; sandbox: boolean };
    kavehNegar?: { apiKey: string; sender: string };
    enamad?: { code: string; link: string };
  };
}

function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={saving} className="btn-primary flex items-center gap-2">
      <Save size={15} />
      {saving ? "در حال ذخیره..." : "ذخیره"}
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("identity");
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin credentials local state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await adminApi.getSettings();
        setSettings(data);
      } catch {
        toast.error("خطا در بارگذاری تنظیمات");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (patch: Partial<Settings>) => {
    try {
      setSaving(true);
      const updated = { ...settings, ...patch };
      await adminApi.updateSettings(updated);
      setSettings(updated);
      toast.success("تنظیمات ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof Settings, v: unknown) => setSettings(s => ({ ...s, [k]: v }));

  const saveAdminCredentials = async () => {
    if (password && password !== confirmPassword) { toast.error("رمزها مطابقت ندارند"); return; }
    try {
      setSaving(true);
      await adminApi.changeCredentials({ username, email, password });
      toast.success("اطلاعات ادمین به‌روز شد");
    } catch {
      toast.error("خطا در به‌روزرسانی");
    } finally {
      setSaving(false);
    }
  };

  const links = settings.customLinks ?? [];
  const setLinks = (v: CustomLink[]) => set("customLinks", v);
  const addLink = () => setLinks([...links, { label: "", url: "", isActive: true }]);
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const updateLink = (i: number, k: keyof CustomLink, v: string | boolean) =>
    setLinks(links.map((l, idx) => idx === i ? { ...l, [k]: v } : l));

  const plans = settings.planPrices ?? { monthly: 0, sixMonths: 0, yearly: 0 };
  const payConf = settings.paymentConfig ?? {};

  if (loading) return <div className="flex items-center justify-center h-64 text-white/50" dir="rtl">در حال بارگذاری...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">تنظیمات</h1>
        <p className="text-white/50 text-sm mt-1">پیکربندی سراسری پلتفرم</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-52 shrink-0">
          <div className="glass-card p-2 space-y-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-right ${
                  activeTab === tab.id
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={activeTab === tab.id ? "text-white" : "text-white/40"}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 glass-card p-6">
          {/* 1. هویت سایت */}
          {activeTab === "identity" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg border-b border-white/10 pb-3">هویت سایت</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-white/60 text-xs mb-1 block">نام سایت</label><input className="input-base w-full" value={settings.siteName ?? ""} onChange={e => set("siteName", e.target.value)} /></div>
                <div><label className="text-white/60 text-xs mb-1 block">توضیح سایت</label><input className="input-base w-full" value={settings.siteDesc ?? ""} onChange={e => set("siteDesc", e.target.value)} /></div>
                <div><label className="text-white/60 text-xs mb-1 block">آدرس لوگو (URL)</label><input className="input-base w-full" value={settings.logoUrl ?? ""} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." /></div>
                <div><label className="text-white/60 text-xs mb-1 block">آدرس فاویکون (URL)</label><input className="input-base w-full" value={settings.faviconUrl ?? ""} onChange={e => set("faviconUrl", e.target.value)} placeholder="https://..." /></div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">رنگ اصلی</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settings.primaryColor ?? "#6366f1"} onChange={e => set("primaryColor", e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border border-white/20" />
                    <input className="input-base flex-1 font-mono text-sm" value={settings.primaryColor ?? "#6366f1"} onChange={e => set("primaryColor", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">رنگ ثانویه</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={settings.accentColor ?? "#8b5cf6"} onChange={e => set("accentColor", e.target.value)} className="w-10 h-9 rounded cursor-pointer bg-transparent border border-white/20" />
                    <input className="input-base flex-1 font-mono text-sm" value={settings.accentColor ?? "#8b5cf6"} onChange={e => set("accentColor", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2"><SaveBtn onClick={() => save({ siteName: settings.siteName, siteDesc: settings.siteDesc, logoUrl: settings.logoUrl, faviconUrl: settings.faviconUrl, primaryColor: settings.primaryColor, accentColor: settings.accentColor })} saving={saving} /></div>
            </div>
          )}

          {/* 2. اطلاعات ادمین */}
          {activeTab === "admin" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg border-b border-white/10 pb-3">اطلاعات ادمین</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-white/60 text-xs mb-1 block">نام کاربری</label><input className="input-base w-full" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">ایمیل</label><input className="input-base w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">رمز عبور جدید</label>
                  <div className="relative">
                    <input className="input-base w-full pl-10" type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="خالی بگذارید تا تغییر نکند" />
                    <button onClick={() => setShowPass(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">تکرار رمز عبور</label>
                  <input className="input-base w-full" type={showPass ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end pt-2"><SaveBtn onClick={saveAdminCredentials} saving={saving} /></div>
            </div>
          )}

          {/* 3. قیمت پلن‌ها */}
          {activeTab === "plans" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg border-b border-white/10 pb-3">قیمت پلن‌ها</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([["monthly", "ماهانه"], ["sixMonths", "شش ماهه"], ["yearly", "سالانه"]] as const).map(([key, label]) => (
                  <div key={key}>
                    <label className="text-white/60 text-xs mb-1 block">{label} (تومان)</label>
                    <input
                      className="input-base w-full text-left font-mono"
                      type="number"
                      min={0}
                      value={plans[key]}
                      onChange={e => set("planPrices", { ...plans, [key]: Number(e.target.value) })}
                    />
                    <p className="text-white/30 text-xs mt-1">{Number(plans[key]).toLocaleString("fa-IR")} تومان</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2"><SaveBtn onClick={() => save({ planPrices: plans })} saving={saving} /></div>
            </div>
          )}

          {/* 4. حالت تعمیر */}
          {activeTab === "maintenance" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg border-b border-white/10 pb-3">حالت تعمیر</h2>
              {settings.maintenanceMode && (
                <div className="flex items-center gap-3 bg-amber-500/15 border border-amber-500/30 rounded-xl px-4 py-3">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                  <p className="text-amber-300 text-sm">سایت در حال حاضر در حالت تعمیر است. کاربران پیام تعمیر را مشاهده می‌کنند.</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`relative w-12 h-7 rounded-full transition ${settings.maintenanceMode ? "bg-amber-500" : "bg-white/20"}`}
                    onClick={() => set("maintenanceMode", !settings.maintenanceMode)}
                  >
                    <div className={`absolute top-1.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.maintenanceMode ? "right-1.5" : "left-1.5"}`} />
                  </div>
                  <span className="text-white/80 text-sm">{settings.maintenanceMode ? <span className="text-amber-400 font-medium">فعال</span> : "غیرفعال"}</span>
                </label>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">پیام تعمیر</label>
                <textarea className="input-base w-full" rows={4} value={settings.maintenanceMsg ?? ""} onChange={e => set("maintenanceMsg", e.target.value)} placeholder="سایت موقتاً در دست تعمیر است. به زودی برمی‌گردیم." />
              </div>
              <div className="flex justify-end pt-2"><SaveBtn onClick={() => save({ maintenanceMode: settings.maintenanceMode, maintenanceMsg: settings.maintenanceMsg })} saving={saving} /></div>
            </div>
          )}

          {/* 5. تنظیمات SEO */}
          {activeTab === "seo" && (
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-lg border-b border-white/10 pb-3">تنظیمات SEO</h2>
              <div className="space-y-4">
                <div><label className="text-white/60 text-xs mb-1 block">عنوان SEO</label><input className="input-base w-full" value={settings.seoTitle ?? ""} onChange={e => set("seoTitle", e.target.value)} placeholder="عنوان صفحه اصلی در موتورهای جستجو" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">توضیح SEO</label><textarea className="input-base w-full" rows={3} value={settings.seoDesc ?? ""} onChange={e => set("seoDesc", e.target.value)} placeholder="توضیح کوتاه برای نمایش در نتایج جستجو (حداکثر ۱۶۰ کاراکتر)" /></div>
                <div><label className="text-white/60 text-xs mb-1 block">کلیدواژه‌ها</label><input className="input-base w-full" value={settings.seoKeywords ?? ""} onChange={e => set("seoKeywords", e.target.value)} placeholder="کلیدواژه۱, کلیدواژه۲, کلیدواژه۳" /></div>
              </div>
              <div className="flex justify-end pt-2"><SaveBtn onClick={() => save({ seoTitle: settings.seoTitle, seoDesc: settings.seoDesc, seoKeywords: settings.seoKeywords })} saving={saving} /></div>
            </div>
          )}

          {/* 6. مدیریت لینک‌ها */}
          {activeTab === "links" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h2 className="text-white font-semibold text-lg">مدیریت لینک‌ها</h2>
                <button onClick={addLink} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"><Plus size={15} /> افزودن لینک</button>
              </div>
              <div className="space-y-3">
                {links.length === 0 && <p className="text-white/30 text-sm text-center py-6">لینکی تعریف نشده است</p>}
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div><label className="text-white/50 text-xs mb-1 block">برچسب</label><input className="input-base w-full" value={link.label} onChange={e => updateLink(i, "label", e.target.value)} /></div>
                      <div><label className="text-white/50 text-xs mb-1 block">آدرس URL</label><input className="input-base w-full" value={link.url} onChange={e => updateLink(i, "url", e.target.value)} placeholder="https://..." /></div>
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50">
                        <div className={`relative w-9 h-5 rounded-full transition ${link.isActive ? "bg-emerald-500" : "bg-white/20"}`} onClick={() => updateLink(i, "isActive", !link.isActive)}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${link.isActive ? "right-0.5" : "left-0.5"}`} />
                        </div>
                        فعال
                      </label>
                      <button onClick={() => removeLink(i)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2"><SaveBtn onClick={() => save({ customLinks: links })} saving={saving} /></div>
            </div>
          )}

          {/* 7. درگاه‌ها */}
          {activeTab === "gateways" && (
            <div className="space-y-6">
              <h2 className="text-white font-semibold text-lg border-b border-white/10 pb-3">درگاه‌ها و سرویس‌ها</h2>

              {/* زرین‌پال */}
              <div className="space-y-3">
                <h3 className="text-white/80 text-sm font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span> زرین‌پال</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">Merchant ID</label>
                    <input className="input-base w-full font-mono text-sm" value={payConf.zarinpal?.merchantId ?? ""} onChange={e => set("paymentConfig", { ...payConf, zarinpal: { ...payConf.zarinpal, merchantId: e.target.value, sandbox: payConf.zarinpal?.sandbox ?? false } })} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer pb-2">
                      <div className={`relative w-10 h-6 rounded-full transition ${payConf.zarinpal?.sandbox ? "bg-amber-500" : "bg-white/20"}`}
                        onClick={() => set("paymentConfig", { ...payConf, zarinpal: { ...payConf.zarinpal, merchantId: payConf.zarinpal?.merchantId ?? "", sandbox: !payConf.zarinpal?.sandbox } })}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${payConf.zarinpal?.sandbox ? "right-1" : "left-1"}`} />
                      </div>
                      <span className="text-white/60 text-sm">حالت آزمایشی (Sandbox)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* کاوه‌نگار */}
              <div className="space-y-3">
                <h3 className="text-white/80 text-sm font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span> کاوه‌نگار (پیامک)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                  <div><label className="text-white/60 text-xs mb-1 block">API Key</label><input className="input-base w-full font-mono text-sm" value={payConf.kavehNegar?.apiKey ?? ""} onChange={e => set("paymentConfig", { ...payConf, kavehNegar: { ...payConf.kavehNegar, apiKey: e.target.value, sender: payConf.kavehNegar?.sender ?? "" } })} /></div>
                  <div><label className="text-white/60 text-xs mb-1 block">شماره فرستنده</label><input className="input-base w-full font-mono text-sm" value={payConf.kavehNegar?.sender ?? ""} onChange={e => set("paymentConfig", { ...payConf, kavehNegar: { ...payConf.kavehNegar, apiKey: payConf.kavehNegar?.apiKey ?? "", sender: e.target.value } })} placeholder="10004..." /></div>
                </div>
              </div>

              {/* اینماد */}
              <div className="space-y-3">
                <h3 className="text-white/80 text-sm font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> اینماد</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
                  <div><label className="text-white/60 text-xs mb-1 block">کد اینماد</label><input className="input-base w-full font-mono text-sm" value={payConf.enamad?.code ?? ""} onChange={e => set("paymentConfig", { ...payConf, enamad: { ...payConf.enamad, code: e.target.value, link: payConf.enamad?.link ?? "" } })} /></div>
                  <div><label className="text-white/60 text-xs mb-1 block">لینک اینماد</label><input className="input-base w-full font-mono text-sm" value={payConf.enamad?.link ?? ""} onChange={e => set("paymentConfig", { ...payConf, enamad: { ...payConf.enamad, code: payConf.enamad?.code ?? "", link: e.target.value } })} placeholder="https://trustseal.enamad.ir/..." /></div>
                </div>
              </div>

              <div className="flex justify-end pt-2"><SaveBtn onClick={() => save({ paymentConfig: payConf })} saving={saving} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
