"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Type, UploadCloud, X } from "lucide-react";
import { brandKitApi, uploadApi } from "@/lib/api";
import { EDITOR_FONTS, createImage, createText } from "@/lib/editor/presets";
import type { EditorObject } from "@/lib/editor/types";
import { toast } from "sonner";
import { ProLock } from "../ui";

export interface BrandKit {
  logoUrl: string | null;
  colors: string[];
  fontFamily: string | null;
  handle: string | null;
  website: string | null;
  phone: string | null;
  defaultCta: string | null;
  shopName?: string;
  shopSlug?: string;
}

export function BrandKitPanel({
  onAdd,
  onApplyFont,
  onKitLoaded,
  isPro,
}: {
  onAdd: (objects: EditorObject[]) => void;
  onApplyFont: (fontFamily: string) => void;
  onKitLoaded?: (kit: BrandKit) => void;
  isPro: boolean;
}) {
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isPro) { setLoading(false); return; }
    brandKitApi
      .get()
      .then((k: any) => { setKit(k); onKitLoaded?.(k); })
      .catch(() => toast.error("خطا در دریافت هویت برند"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  if (!isPro) return <ProLock feature="هویت برند" />;

  const set = (p: Partial<BrandKit>) => setKit((k) => (k ? { ...k, ...p } : k));

  const save = async () => {
    if (!kit) return;
    setSaving(true);
    try {
      const saved: any = await brandKitApi.save({
        logoUrl: kit.logoUrl ?? undefined,
        colors: kit.colors,
        fontFamily: kit.fontFamily ?? undefined,
        handle: kit.handle ?? undefined,
        website: kit.website ?? undefined,
        phone: kit.phone ?? undefined,
        defaultCta: kit.defaultCta ?? undefined,
      });
      setKit(saved);
      onKitLoaded?.(saved);
      toast.success("هویت برند ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره هویت برند");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      // Site-relative on purpose — see the note in ProductStoryWizard.
      set({ logoUrl: await uploadApi.image(file) });
    } catch {
      toast.error("خطا در آپلود لوگو");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !kit) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
      </div>
    );
  }

  const addLogo = () => {
    if (!kit.logoUrl) return;
    onAdd([createImage(kit.logoUrl, { name: "لوگو", x: 840, y: 120, width: 160, height: 160, cornerRadius: 24 })]);
  };

  const addFooter = () => {
    const line = [kit.handle, kit.website].filter(Boolean).join("  •  ");
    if (!line) return;
    onAdd([
      createText({
        name: "اطلاعات تماس", text: line,
        x: 90, y: 1720, width: 900, height: 60,
        fontSize: 36, fontWeight: 400, align: "center",
        fill: "#FFFFFF", direction: "ltr",
      }),
    ]);
  };

  const addCta = () => {
    if (!kit.defaultCta) return;
    onAdd([
      createText({
        name: "دعوت به اقدام", text: kit.defaultCta,
        x: 290, y: 1450, width: 500, height: 80,
        fontSize: 44, fontWeight: 700, align: "center",
        fill: "#FFFFFF",
        backgroundFill: kit.colors[0] || "#14C7A5",
        backgroundPadding: 24, backgroundRadius: 999,
      }),
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Quick actions come first — this panel is used far more often to
          place brand assets than to edit them. */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={addLogo} disabled={!kit.logoUrl}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-all">
          <Plus className="w-3.5 h-3.5" /> افزودن لوگو
        </button>
        <button onClick={addFooter} disabled={!kit.handle && !kit.website}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-all">
          <Plus className="w-3.5 h-3.5" /> افزودن آیدی
        </button>
        <button onClick={addCta} disabled={!kit.defaultCta}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-all">
          <Plus className="w-3.5 h-3.5" /> افزودن دکمه
        </button>
        <button onClick={() => { if (kit.fontFamily) { onApplyFont(kit.fontFamily); toast.success("فونت برند اعمال شد"); } }} disabled={!kit.fontFamily}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-40 transition-all">
          <Type className="w-3.5 h-3.5" /> فونت به همه متن‌ها
        </button>
      </div>

      <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-3">
        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">لوگوی برند</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 cursor-pointer shrink-0 transition-all">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              آپلود
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
            {kit.logoUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={kit.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                <button onClick={() => set({ logoUrl: null })} aria-label="حذف لوگو" className="p-2 rounded-lg text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            <span className="text-[10px] text-gray-400 mr-auto">پیش‌فرض: آواتار فروشگاه</span>
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">رنگ‌های برند</span>
          <div className="flex items-center gap-2 flex-wrap">
            {kit.colors.map((c, i) => (
              <span key={i} className="relative group">
                <input
                  type="color"
                  value={c.startsWith("#") ? c : "#000000"}
                  onChange={(e) => set({ colors: kit.colors.map((x, j) => (j === i ? e.target.value : x)) })}
                  className="w-9 h-9 rounded-lg border border-black/10 dark:border-white/10 bg-transparent cursor-pointer"
                  aria-label={`رنگ ${i + 1}`}
                />
                <button
                  onClick={() => set({ colors: kit.colors.filter((_, j) => j !== i) })}
                  aria-label="حذف رنگ"
                  className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-black/70 text-white text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </span>
            ))}
            {kit.colors.length < 8 && (
              <button
                onClick={() => set({ colors: [...kit.colors, "#14C7A5"] })}
                aria-label="افزودن رنگ"
                className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 dark:border-white/15 text-gray-400 hover:border-accent-500 hover:text-accent-500 transition-colors"
              >
                +
              </button>
            )}
          </div>
        </div>

        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">فونت برند</span>
          <select value={kit.fontFamily ?? ""} onChange={(e) => set({ fontFamily: e.target.value || null })} className="input-base w-full">
            <option value="">بدون فونت پیش‌فرض</option>
            <optgroup label="فارسی">
              {EDITOR_FONTS.filter((f) => f.group === "fa").map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </optgroup>
            <optgroup label="English">
              {EDITOR_FONTS.filter((f) => f.group === "en").map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">آیدی</span>
            <input value={kit.handle ?? ""} onChange={(e) => set({ handle: e.target.value })} placeholder="@yourshop" dir="ltr" className="input-base w-full" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">وب‌سایت</span>
            <input value={kit.website ?? ""} onChange={(e) => set({ website: e.target.value })} placeholder="shop.ir" dir="ltr" className="input-base w-full" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">تلفن</span>
            <input value={kit.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} placeholder="۰۹۱۲..." dir="ltr" className="input-base w-full" />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">دعوت به اقدام</span>
            <input value={kit.defaultCta ?? ""} onChange={(e) => set({ defaultCta: e.target.value })} placeholder="سفارش بده" className="input-base w-full" />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent-500 hover:bg-accent-400 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره هویت برند
        </button>
      </div>
    </div>
  );
}
