"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Upload, Loader2, Camera, ExternalLink, Palette, Video,
  BarChart3, X, Image as ImageIcon, Check, Plus, Landmark,
} from "lucide-react";
import { shopsApi, bankCardsApi, uploadApi } from "@/lib/api";

// فونت‌های فارسی self-hosted (فایل‌ها در public/fonts + @font-face در globals.css)
const FONTS = [
  { value: "Vazirmatn", label: "وزیرمتن" },
  { value: "Lalezar", label: "لاله‌زار" },
  { value: "Sahel", label: "ساحل" },
  { value: "Samim", label: "صمیم" },
  { value: "Estedad", label: "استعداد" },
];

const COLORS = [
  "#F97316", "#EF4444", "#8B5CF6", "#06B6D4",
  "#10B981", "#F59E0B", "#EC4899", "#6366F1",
  "#111827", "#374151", "#0EA5E9", "#14B8A6",
];

const THEMES = [
  { id: "default",   label: "پیش‌فرض",    preview: ["#F97316", "#0A0A0F"] },
  { id: "minimal",   label: "مینیمال",    preview: ["#111827", "#F9FAFB"] },
  { id: "ocean",     label: "اقیانوس",    preview: ["#0EA5E9", "#0C1A2E"] },
  { id: "forest",    label: "جنگل",       preview: ["#10B981", "#0A1A12"] },
  { id: "sunset",    label: "غروب",       preview: ["#F59E0B", "#1A0F00"] },
  { id: "royal",     label: "سلطنتی",     preview: ["#8B5CF6", "#0D0920"] },
  { id: "rose",      label: "گل رز",      preview: ["#EC4899", "#1A0A10"] },
  { id: "candy",     label: "آبنبات",     preview: ["#F472B6", "#FFF0F5"] },
  { id: "neon",      label: "نئون",       preview: ["#00FF88", "#050505"] },
  { id: "cyber",     label: "سایبر",      preview: ["#06B6D4", "#020915"] },
  { id: "gold",      label: "طلایی",      preview: ["#D97706", "#1A1400"] },
  { id: "crimson",   label: "قرمز",       preview: ["#EF4444", "#1A0505"] },
];

type Tab = "profile" | "media" | "tracking" | "payment" | "settlement";

export default function ShopSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("profile");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarVideoUploading, setAvatarVideoUploading] = useState(false);
  const [bgVideoUploading, setBgVideoUploading] = useState(false);

  const [bankCards, setBankCards] = useState<any[]>([]);
  const [addingCard, setAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ cardNumber: "", cardHolder: "", bankName: "" });
  const [cardSaving, setCardSaving] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const avatarVideoRef = useRef<HTMLInputElement>(null);
  const bgVideoRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, setValue, watch } = useForm();
  const primaryColor   = watch("primaryColor",   "#F97316");
  const secondaryColor = watch("secondaryColor",  "#ffffff");
  const themeId        = watch("themeId",         "default");

  useEffect(() => {
    shopsApi.getMine().then((data: any) => {
      setShop(data);
      setBankCards(data?.bankCards || []);
      if (data) {
        setValue("name",           data.name || "");
        setValue("slug",           data.slug || "");
        setValue("bio",            data.bio || "");
        setValue("primaryColor",   data.primaryColor   || "#F97316");
        setValue("secondaryColor", data.secondaryColor || "#ffffff");
        setValue("themeId",        data.themeId        || "default");
        setValue("fontFamily",     data.fontFamily     || "Vazirmatn");
        setValue("gaId",           data.gaId           || "");
        setValue("metaPixel",      data.metaPixel      || "");
        setValue("deliveryType",   data.deliveryType   || "telegram");
        setValue("deliveryContact",data.deliveryContact|| "");
        setValue("deliveryNote",   data.deliveryNote   || "");
        setValue("settlementSheba",    data.settlementSheba    || "");
        setValue("settlementHolder",   data.settlementHolder   || "");
        setValue("settlementBankName", data.settlementBankName || "");
      }
    }).finally(() => setLoading(false));
  }, [setValue]);

  const addBankCard = async () => {
    if (bankCards.length >= 4) return;
    if (!newCard.cardNumber || !newCard.cardHolder || !newCard.bankName) {
      toast.error("همه فیلدهای کارت الزامی است");
      return;
    }
    setCardSaving(true);
    try {
      const created = await bankCardsApi.create(newCard);
      setBankCards((c) => [...c, created]);
      setNewCard({ cardNumber: "", cardHolder: "", bankName: "" });
      setAddingCard(false);
      toast.success("کارت اضافه شد");
    } catch (e: any) {
      toast.error(e?.message || "خطا در افزودن کارت");
    } finally {
      setCardSaving(false);
    }
  };

  const removeBankCard = async (id: string) => {
    try {
      await bankCardsApi.remove(id);
      const list: any = await bankCardsApi.list();
      setBankCards(list || []);
      toast.success("کارت حذف شد");
    } catch {
      toast.error("خطا در حذف کارت");
    }
  };

  const activateBankCard = async (id: string) => {
    try {
      await bankCardsApi.activate(id);
      setBankCards((c) => c.map((x) => ({ ...x, isActive: x.id === id })));
      toast.success("کارت فعال شد");
    } catch {
      toast.error("خطا در فعال‌سازی کارت");
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      await shopsApi.update(data);
      toast.success("تغییرات ذخیره شد");
    } catch (e: any) {
      toast.error(e?.message || "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (
    file: File,
    type: "image" | "video",
    field: string,
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true);
    try {
      const url = type === "video" ? await uploadApi.video(file) : await uploadApi.image(file);
      await shopsApi.update({ [field]: url });
      setShop((s: any) => ({ ...s, [field]: url }));
      toast.success("آپلود شد");
    } catch { toast.error("خطا در آپلود"); }
    finally { setUploading(false); }
  };

  const clearField = async (field: string) => {
    await shopsApi.update({ [field]: null });
    setShop((s: any) => ({ ...s, [field]: null }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
    </div>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile",    label: "پروفایل" },
    { id: "media",      label: "رسانه" },
    { id: "payment",    label: "کارت بانکی" },
    { id: "settlement", label: "تسویه و حساب" },
    { id: "tracking",   label: "آمارگیری" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">تنظیمات صفحه</h1>
        {shop?.slug && (
          <a href={`/${shop.slug}`} target="_blank" rel="noopener noreferrer"
            className="text-sm text-accent-500 hover:text-accent-400 inline-flex items-center gap-1 mt-1">
            weeelink.com/{shop.slug}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Tab: Profile ─────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="space-y-6">
          {/* Banner + Avatar */}
          <div className="relative">
            <div
              className="w-full h-32 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10
                         bg-gradient-to-r from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/3
                         cursor-pointer group"
              onClick={() => bannerRef.current?.click()}>
              {shop?.bannerUrl
                ? <img src={shop.bannerUrl} alt="" className="w-full h-full object-cover" />
                : <div className="flex items-center justify-center h-full text-gray-400 gap-2 text-sm">
                    <Upload className="w-4 h-4" /> آپلود بنر
                  </div>}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
                              transition-opacity flex items-center justify-center">
                {bannerUploading
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />}
              </div>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "image", "bannerUrl", setBannerUploading)} />

            {/* Avatar */}
            <div
              className="absolute right-4 -bottom-8 w-16 h-16 rounded-2xl overflow-hidden
                         border-4 border-white dark:border-[#0A0A0F] cursor-pointer group"
              style={{ boxShadow: `0 0 0 2px ${primaryColor}50` }}
              onClick={() => avatarRef.current?.click()}>
              {shop?.avatarUrl
                ? <img src={shop.avatarUrl} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-accent-500/20 flex items-center justify-center text-xl">
                    {shop?.name?.[0] || "؟"}
                  </div>}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                              transition-opacity flex items-center justify-center">
                {avatarUploading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Camera className="w-4 h-4 text-white" />}
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "image", "avatarUrl", setAvatarUploading)} />
          </div>

          <div className="pt-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">نام صفحه</label>
                  <input {...register("name")} className="input-base" placeholder="نام فروشگاه شما" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آدرس اختصاصی</label>
                  <input {...register("slug")} className="input-base text-left pl-4" dir="ltr" placeholder="myshop" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  بیو <span className="text-gray-400 font-normal">(حداکثر ۲۵۰ کاراکتر)</span>
                </label>
                <textarea {...register("bio")} rows={3} className="input-base resize-none"
                  placeholder="توضیح کوتاهی درباره فروشگاه یا خودت..." />
              </div>

              {/* ─── Themes ────────────────────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                  <Palette className="w-4 h-4" /> تم آماده
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {THEMES.map((theme) => (
                    <button key={theme.id} type="button"
                      onClick={() => setValue("themeId", theme.id)}
                      className={`relative rounded-xl overflow-hidden h-12 flex flex-col transition-all border-2 ${
                        themeId === theme.id
                          ? "border-accent-500 scale-105 shadow-lg"
                          : "border-transparent hover:border-white/20"
                      }`}>
                      <div className="flex-1" style={{ background: theme.preview[1] }} />
                      <div className="h-3" style={{ background: theme.preview[0] }} />
                      {themeId === theme.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400 text-center">
                  {THEMES.find((t) => t.id === themeId)?.label}
                </div>
              </div>

              {/* ─── Colors ────────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رنگ اصلی</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setValue("primaryColor", c)}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: primaryColor === c ? c : "transparent",
                          boxShadow: primaryColor === c ? `0 0 12px ${c}60` : "none",
                        }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor}
                      onChange={(e) => setValue("primaryColor", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <input {...register("primaryColor")} className="input-base font-mono text-sm flex-1" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">رنگ ثانویه</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setValue("secondaryColor", c)}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: secondaryColor === c ? c : "transparent",
                          boxShadow: secondaryColor === c ? `0 0 12px ${c}60` : "none",
                        }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={secondaryColor}
                      onChange={(e) => setValue("secondaryColor", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <input {...register("secondaryColor")} className="input-base font-mono text-sm flex-1" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* ─── Font ──────────────────────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">فونت</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FONTS.map((f) => (
                    <button key={f.value} type="button"
                      onClick={() => setValue("fontFamily", f.value)}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                        watch("fontFamily") === f.value
                          ? "border-accent-500 bg-accent-500/10 text-accent-500"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
                      }`}
                      style={{ fontFamily: f.value }}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register("fontFamily")} />
              </div>

              <button type="submit" disabled={saving}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                           bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm
                           transition-all disabled:opacity-60 shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Tab: Media ────────────────────────────────────────────────────────── */}
      {tab === "media" && (
        <div className="space-y-6">
          {/* Avatar Video — PRO */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-accent-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">ویدیو پروفایل</h3>
              <span className="text-xs bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-md">Pro</span>
              <span className="text-xs text-gray-400">(حداکثر ۱۰ ثانیه، ۵۰MB)</span>
            </div>
            <p className="text-xs text-gray-500">جایگزین عکس پروفایل می‌شود — در صفحه بیوی شما پخش می‌شود</p>
            {shop?.avatarVideo ? (
              <div className="relative w-fit">
                <video src={shop.avatarVideo} className="w-24 h-24 rounded-2xl object-cover" autoPlay muted loop playsInline />
                <button onClick={() => clearField("avatarVideo")}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => avatarVideoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed
                           border-gray-200 dark:border-white/10 text-sm text-gray-500
                           hover:border-accent-500/50 hover:text-accent-500 transition-all">
                {avatarVideoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {avatarVideoUploading ? "در حال آپلود..." : "آپلود ویدیو پروفایل"}
              </button>
            )}
            <input ref={avatarVideoRef} type="file" accept="video/mp4,video/webm,video/mov" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "video", "avatarVideo", setAvatarVideoUploading)} />
          </div>

          {/* Background Video — PRO */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">پس‌زمینه ویدیویی</h3>
              <span className="text-xs bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-md">Pro</span>
              <span className="text-xs text-gray-400">(حداکثر ۵۰MB)</span>
            </div>
            <p className="text-xs text-gray-500">در پس‌زمینه صفحه بیوی شما به‌صورت loop پخش می‌شود</p>
            {shop?.bgVideoUrl ? (
              <div className="relative">
                <video src={shop.bgVideoUrl} className="w-full h-28 rounded-xl object-cover" autoPlay muted loop playsInline />
                <button onClick={() => clearField("bgVideoUrl")}
                  className="absolute top-2 left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => bgVideoRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed
                           border-gray-200 dark:border-white/10 text-sm text-gray-500
                           hover:border-purple-500/50 hover:text-purple-500 transition-all">
                {bgVideoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {bgVideoUploading ? "در حال آپلود..." : "آپلود ویدیو پس‌زمینه"}
              </button>
            )}
            <input ref={bgVideoRef} type="file" accept="video/mp4,video/webm,video/mov" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "video", "bgVideoUrl", setBgVideoUploading)} />
          </div>

          {/* Background Image */}
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">تصویر پس‌زمینه</h3>
            </div>
            <p className="text-xs text-gray-500">اگر ویدیو پس‌زمینه ندارید، تصویر نشان داده می‌شود</p>
            {shop?.bgImageUrl ? (
              <div className="relative">
                <img src={shop.bgImageUrl} alt="" className="w-full h-28 rounded-xl object-cover" />
                <button onClick={() => clearField("bgImageUrl")}
                  className="absolute top-2 left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed
                               border-gray-200 dark:border-white/10 text-sm text-gray-500
                               hover:border-blue-500/50 hover:text-blue-500 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                آپلود تصویر پس‌زمینه
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "image", "bgImageUrl", () => {})} />
              </label>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Payment (bank cards) ─────────────────────────────────────────── */}
      {tab === "payment" && (
        <div className="space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">کارت‌های بانکی (کارت‌به‌کارت)</h3>
              <p className="text-xs text-gray-500 mt-1">
                تا ۴ کارت می‌توانید ثبت کنید. کارت فعال هنگام تسویه‌حساب محصولات فیزیکی و فروش فایل دیجیتال
                به خریدار نمایش داده می‌شود تا بتواند کارت‌به‌کارت واریز کند.
              </p>
            </div>

            {bankCards.length > 0 && (
              <div className="space-y-2.5">
                {bankCards.map((c) => (
                  <div key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      c.isActive
                        ? "border-accent-500 bg-accent-500/5"
                        : "border-gray-200 dark:border-white/10"
                    }`}>
                    <button type="button" onClick={() => activateBankCard(c.id)}
                      title="انتخاب به‌عنوان کارت فعال"
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        c.isActive ? "border-accent-500 bg-accent-500" : "border-gray-300 dark:border-white/20"
                      }`}>
                      {c.isActive && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm tracking-widest text-gray-900 dark:text-white" dir="ltr">
                        {String(c.cardNumber).replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1-")}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.cardHolder} · {c.bankName}</div>
                    </div>
                    {c.isActive && (
                      <span className="text-[10px] bg-accent-500/20 text-accent-500 px-1.5 py-0.5 rounded-md shrink-0">فعال</span>
                    )}
                    <button type="button" onClick={() => removeBankCard(c.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
                                 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {bankCards.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">هنوز کارتی ثبت نشده است</p>
            )}

            {bankCards.length < 4 && (
              addingCard ? (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">شماره کارت</label>
                    <input value={newCard.cardNumber}
                      onChange={(e) => setNewCard((s) => ({ ...s, cardNumber: e.target.value }))}
                      inputMode="numeric" dir="ltr" className="input-base font-mono tracking-widest text-left"
                      placeholder="6037-9974-xxxx-xxxx" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">نام صاحب کارت</label>
                      <input value={newCard.cardHolder}
                        onChange={(e) => setNewCard((s) => ({ ...s, cardHolder: e.target.value }))}
                        className="input-base" placeholder="مثال: علی رضایی" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5">نام بانک</label>
                      <input value={newCard.bankName}
                        onChange={(e) => setNewCard((s) => ({ ...s, bankName: e.target.value }))}
                        className="input-base" placeholder="مثال: بانک ملت" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={cardSaving} onClick={addBankCard}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 hover:bg-accent-400
                                 text-white text-sm font-bold disabled:opacity-60 transition-all">
                      {cardSaving && <Loader2 className="w-4 h-4 animate-spin" />} ذخیره کارت
                    </button>
                    <button type="button"
                      onClick={() => { setAddingCard(false); setNewCard({ cardNumber: "", cardHolder: "", bankName: "" }); }}
                      className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingCard(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed
                             border-gray-200 dark:border-white/10 text-sm text-gray-500
                             hover:border-accent-500/50 hover:text-accent-500 transition-all">
                  <Plus className="w-4 h-4" /> افزودن کارت جدید
                </button>
              )
            )}
          </div>

          {/* راه ارتباطی تحویل (فایل/دوره/محصول) */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="glass-card p-5 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">راه ارتباطی تحویل</h3>
                <p className="text-xs text-gray-500 mt-1">
                  مشتری پس از پرداخت، رسید را به این راه ارتباطی می‌فرستد تا فایل/دسترسی/سفارش را دریافت کند.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">پیام‌رسان</label>
                  <select {...register("deliveryType")}
                    className="input-base bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
                    {[["telegram","تلگرام"],["bale","بله"],["rubika","روبیکا"],["eitaa","ایتا"],["whatsapp","واتساپ"]].map(([v,l]) => (
                      <option key={v} value={v} className="bg-gray-100 dark:bg-[#1a1a2e] text-gray-900 dark:text-white">{l}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1.5">یوزرنیم یا لینک</label>
                  <input {...register("deliveryContact")} dir="ltr" className="input-base text-left"
                    placeholder="@myusername یا https://t.me/myusername" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">توضیح تحویل (اختیاری)</label>
                <input {...register("deliveryNote")} className="input-base"
                  placeholder="مثال: پس از ارسال رسید، فایل تا ۱ ساعت ارسال می‌شود" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                         bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm
                         transition-all disabled:opacity-60 shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              ذخیره
            </button>
          </form>
        </div>
      )}

      {/* ─── Tab: Settlement (تسویه و حساب) ────────────────────────────────────── */}
      {tab === "settlement" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-accent-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">تسویه و حساب</h3>
            </div>
            <p className="text-xs text-gray-500">
              این اطلاعات برای واریز درآمد شما از فروش‌های درگاه پرداخت ویلینک استفاده می‌شود.
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">شماره شبا</label>
              <input {...register("settlementSheba")} inputMode="numeric" dir="ltr"
                className="input-base font-mono tracking-widest text-left" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">نام صاحب حساب</label>
                <input {...register("settlementHolder")} className="input-base" placeholder="مثال: علی رضایی" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">نام بانک</label>
                <input {...register("settlementBankName")} className="input-base" placeholder="مثال: بانک ملت" />
              </div>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white bg-accent-500/10 border border-accent-500/20 rounded-xl px-4 py-3">
              تسویه‌حساب‌ها به صورت هفتگی می‌باشد.
            </p>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm
                       transition-all disabled:opacity-60 shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            ذخیره
          </button>
        </form>
      )}

      {/* ─── Tab: Tracking ─────────────────────────────────────────────────────── */}
      {tab === "tracking" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Google Analytics</h3>
              <span className="text-xs bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-md">Pro</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">شناسه اندازه‌گیری (Measurement ID)</label>
              <input {...register("gaId")}
                className="input-base font-mono text-sm" dir="ltr"
                placeholder="G-XXXXXXXXXX" />
              <p className="text-xs text-gray-400 mt-1.5">
                از Google Analytics → Admin → Data Streams دریافت کنید
              </p>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">f</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Meta Pixel</h3>
              <span className="text-xs bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-md">Pro</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">شناسه Pixel</label>
              <input {...register("metaPixel")}
                className="input-base font-mono text-sm" dir="ltr"
                placeholder="123456789012345" />
              <p className="text-xs text-gray-400 mt-1.5">
                از Meta Business Suite → Events Manager دریافت کنید
              </p>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       bg-accent-500 hover:bg-accent-400 text-white font-bold text-sm
                       transition-all disabled:opacity-60 shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        </form>
      )}
    </div>
  );
}
