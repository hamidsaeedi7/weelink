"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Download, Loader2, ImagePlus, UploadCloud, X, Type, Crown, AtSign, EyeOff, Zap, Share2, Images, Trash2,
  Lock, Move, RotateCcw, ImageIcon, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { productsApi, shopsApi, accountApi, uploadApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface Shop {
  name: string;
  slug: string;
  avatarUrl?: string;
}

const TEMPLATES = [
  { key: "sale", label: "فروش ویژه", swatch: "linear-gradient(135deg, #7C2D12, #F97316)" },
  { key: "blackfriday", label: "بلک فرایدی", swatch: "linear-gradient(135deg, #000000, #3F3F46)" },
  { key: "nowruz", label: "عید نوروز", swatch: "linear-gradient(135deg, #0EA88A, #CA8A04)" },
  { key: "valentine", label: "ولنتاین", swatch: "linear-gradient(135deg, #BE123C, #F9A8D4)" },
  { key: "yalda", label: "شب یلدا", swatch: "linear-gradient(135deg, #3B0764, #7C2D12)" },
  { key: "newproduct", label: "محصول جدید", swatch: "linear-gradient(135deg, #08090C, #0EA88A)" },
  { key: "ramadan", label: "ماه رمضان", swatch: "linear-gradient(135deg, #1E1B4B, #7C3AED)" },
  { key: "eidfitr", label: "عید فطر", swatch: "linear-gradient(135deg, #065F46, #FBBF24)" },
  { key: "mothersday", label: "روز مادر", swatch: "linear-gradient(135deg, #831843, #F9A8D4)" },
  { key: "fathersday", label: "روز پدر", swatch: "linear-gradient(135deg, #0F172A, #3B82F6)" },
  { key: "flashsale", label: "فروش لحظه‌ای", swatch: "linear-gradient(135deg, #7F1D1D, #FACC15)" },
  { key: "clearance", label: "حراج پایان فصل", swatch: "linear-gradient(135deg, #1E293B, #F97316)" },
];

const EXPORT_SIZES = [
  { key: "story", label: "استوری", ratioLabel: "۹:۱۶", aspect: "9/16" },
  { key: "post", label: "پست مربعی", ratioLabel: "۱:۱", aspect: "1/1" },
  { key: "portrait", label: "پست عمودی", ratioLabel: "۴:۵", aspect: "4/5" },
];

const FONT_OPTIONS = [
  { key: "vazir", label: "وزیر", group: "fa" as const },
  { key: "lalezar", label: "لاله‌زار", group: "fa" as const },
  { key: "sahel", label: "ساحل", group: "fa" as const },
  { key: "shabnam", label: "شبنم", group: "fa" as const },
  { key: "poppins", label: "Poppins", group: "en" as const },
  { key: "montserrat", label: "Montserrat", group: "en" as const },
  { key: "bebasneue", label: "Bebas Neue", group: "en" as const },
  { key: "playfair", label: "Playfair Display", group: "en" as const },
  { key: "oswald", label: "Oswald", group: "en" as const },
];

const DEFAULT_IMAGE_POS = { x: 50, y: 40 };
const DEFAULT_TITLE_POS = { x: 50, y: 66 };

function ProLockBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md tracking-wide">
      <Lock className="w-2.5 h-2.5" /> PRO
    </span>
  );
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "https://api.weeelink.ir";
const PREFS_KEY_PREFIX = "weelink-story-gen-prefs:";
const GALLERY_KEY_PREFIX = "weelink-story-gen-gallery:";
const MAX_GALLERY = 8;

interface GalleryEntry {
  id: string;
  url: string;
  template: string;
  ratio: string;
  title: string;
}

// satori runs server-side and can't resolve site-relative paths (/uploads/...);
// every image url handed to the story-image route must be absolute.
function toAbsolute(url: string) {
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

// Rough heuristic — satori's box is ~880px (scaled) at 2 lines max before it
// starts crowding the image/price below it. Bigger font = fewer chars fit.
function estimateMaxTitleChars(titleSize: number) {
  return Math.max(14, Math.round(2000 / titleSize));
}

export default function StoryGeneratorPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<string>("custom");
  const [customTitle, setCustomTitle] = useState("محصول ویژه");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("0");
  const [template, setTemplate] = useState("sale");
  const [titleSize, setTitleSize] = useState(56);
  const [exportSize, setExportSize] = useState("story");
  const [font, setFont] = useState("vazir");

  // Freeform drag positions (percent of canvas) for the product image and title.
  const [imagePos, setImagePos] = useState(DEFAULT_IMAGE_POS);
  const [titlePos, setTitlePos] = useState(DEFAULT_TITLE_POS);
  const [dragTarget, setDragTarget] = useState<"image" | "title" | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  // Pro-only branding controls
  const [hideWatermark, setHideWatermark] = useState(false);
  const [customLogo, setCustomLogo] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [bgImage, setBgImage] = useState("");
  const [quality, setQuality] = useState<"normal" | "hd">("normal");

  const [imgUploading, setImgUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [gallery, setGallery] = useState<GalleryEntry[]>([]);
  const [canShare, setCanShare] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    Promise.all([productsApi.getAll(), shopsApi.getMine(), accountApi.getMe()])
      .then(([p, s, u]: any) => {
        setProducts(Array.isArray(p) ? p : []);
        setShop(s);
        setIsPro(u?.plan === "PRO");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Remember the last-used look per shop so sellers don't reconfigure every visit.
  useEffect(() => {
    if (!shop?.slug || prefsLoaded) return;
    try {
      const raw = localStorage.getItem(`${PREFS_KEY_PREFIX}${shop.slug}`);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs.template) setTemplate(prefs.template);
        if (prefs.titleSize) setTitleSize(prefs.titleSize);
        if (prefs.exportSize) setExportSize(prefs.exportSize);
        if (prefs.font) setFont(prefs.font);
        if (prefs.imagePos) setImagePos(prefs.imagePos);
        if (prefs.titlePos) setTitlePos(prefs.titlePos);
        if (prefs.hideWatermark) setHideWatermark(true);
        if (prefs.customLogo) setCustomLogo(prefs.customLogo);
        if (prefs.socialHandle) setSocialHandle(prefs.socialHandle);
        if (prefs.bgImage) setBgImage(prefs.bgImage);
        if (prefs.quality) setQuality(prefs.quality);
      }
    } catch { /* ignore corrupt/blocked storage */ }
    setPrefsLoaded(true);
  }, [shop?.slug, prefsLoaded]);

  useEffect(() => {
    if (!shop?.slug || !prefsLoaded) return;
    const prefs = { template, titleSize, exportSize, font, imagePos, titlePos, hideWatermark, customLogo, socialHandle, bgImage, quality };
    try { localStorage.setItem(`${PREFS_KEY_PREFIX}${shop.slug}`, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [shop?.slug, prefsLoaded, template, titleSize, exportSize, font, imagePos, titlePos, hideWatermark, customLogo, socialHandle, bgImage, quality]);

  // Recently-generated gallery — a lightweight "keep for later" list, saved as
  // just the recipe URL (satori regenerates the exact same image from it).
  useEffect(() => {
    if (!shop?.slug) return;
    try {
      const raw = localStorage.getItem(`${GALLERY_KEY_PREFIX}${shop.slug}`);
      if (raw) setGallery(JSON.parse(raw));
    } catch { /* ignore corrupt/blocked storage */ }
  }, [shop?.slug]);

  const addToGallery = (url: string) => {
    if (!shop?.slug) return;
    const entry: GalleryEntry = { id: `${Date.now()}`, url, template, ratio: exportSize, title };
    setGallery((prev) => {
      const next = [entry, ...prev.filter((g) => g.url !== url)].slice(0, MAX_GALLERY);
      try { localStorage.setItem(`${GALLERY_KEY_PREFIX}${shop.slug}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const removeFromGallery = (id: string) => {
    setGallery((prev) => {
      const next = prev.filter((g) => g.id !== id);
      if (shop?.slug) {
        try { localStorage.setItem(`${GALLERY_KEY_PREFIX}${shop.slug}`, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentTemplate = TEMPLATES.find((t) => t.key === template) || TEMPLATES[0];
  const currentSize = EXPORT_SIZES.find((s) => s.key === exportSize) || EXPORT_SIZES[0];

  const title = selectedProduct ? selectedProduct.name : customTitle;
  const price = selectedProduct ? selectedProduct.price : customPrice ? Number(customPrice) : null;
  const image = selectedProduct ? selectedProduct.images?.[0] : customImage;

  const maxTitleChars = estimateMaxTitleChars(titleSize);
  const titleTooLong = title.length > maxTitleChars;

  const targetUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("template", template);
    params.set("ratio", exportSize);
    params.set("title", title || "");
    params.set("titleSize", String(titleSize));
    params.set("font", font);
    params.set("imageX", String(Math.round(imagePos.x)));
    params.set("imageY", String(Math.round(imagePos.y)));
    params.set("titleX", String(Math.round(titlePos.x)));
    params.set("titleY", String(Math.round(titlePos.y)));
    if (price) params.set("price", String(price));
    if (Number(discountPercent) > 0) params.set("discountPercent", discountPercent);
    if (shop?.name) params.set("shopName", shop.name);
    if (shop?.slug) params.set("shopSlug", shop.slug);
    if (shop?.avatarUrl) params.set("shopLogo", toAbsolute(shop.avatarUrl));
    if (image) params.set("image", toAbsolute(image));
    if (isPro && customLogo) params.set("customLogo", toAbsolute(customLogo));
    if (isPro && socialHandle.trim()) params.set("socialHandle", socialHandle.trim());
    if (isPro && hideWatermark) params.set("hideWatermark", "1");
    if (isPro && bgImage) params.set("bgImage", toAbsolute(bgImage));
    if (isPro && quality === "hd") params.set("quality", "hd");
    return `/api/story-image?${params.toString()}`;
  }, [template, exportSize, title, price, discountPercent, shop, image, titleSize, font, imagePos, titlePos, isPro, customLogo, socialHandle, hideWatermark, bgImage, quality]);

  // Debounce so rapid typing doesn't fire a fresh server-side render on every keystroke.
  const [debouncedUrl, setDebouncedUrl] = useState(targetUrl);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedUrl(targetUrl), 450);
    return () => clearTimeout(t);
  }, [targetUrl]);

  // Preload the next frame off-screen and only swap once it's ready, so the
  // preview never flashes black/broken while a new render is in flight.
  const [displayedUrl, setDisplayedUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(false);
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setDisplayedUrl(debouncedUrl);
      setPreviewLoading(false);
    };
    img.onerror = () => {
      if (cancelled) return;
      setPreviewLoading(false);
      setPreviewError(true);
    };
    img.src = debouncedUrl;
    return () => { cancelled = true; };
  }, [debouncedUrl]);

  const handleImageUpload = async (file: File) => {
    setImgUploading(true);
    try {
      const url = await uploadApi.image(file);
      setCustomImage(url);
      toast.success("عکس آپلود شد");
    } catch {
      toast.error("خطا در آپلود عکس");
    } finally {
      setImgUploading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const url = await uploadApi.image(file);
      setCustomLogo(url);
      toast.success("لوگو آپلود شد");
    } catch {
      toast.error("خطا در آپلود لوگو");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBgUpload = async (file: File) => {
    setBgUploading(true);
    try {
      const url = await uploadApi.image(file);
      setBgImage(url);
      toast.success("پس‌زمینه آپلود شد");
    } catch {
      toast.error("خطا در آپلود پس‌زمینه");
    } finally {
      setBgUploading(false);
    }
  };

  // Freeform drag — Pointer Events unify mouse + touch, so this works the
  // same on desktop and mobile. The handle's own on-screen position updates
  // every pointermove (instant, local state); the actual rendered story only
  // re-syncs once the pointer is released, via the normal debounced preview.
  const posFromPointer = (e: React.PointerEvent) => {
    const rect = previewBoxRef.current!.getBoundingClientRect();
    const x = Math.min(96, Math.max(4, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(96, Math.max(4, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const onHandlePointerDown = (target: "image" | "title") => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragTarget(target);
    setDragPos(target === "image" ? imagePos : titlePos);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragTarget) return;
    setDragPos(posFromPointer(e));
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragTarget) return;
    const p = posFromPointer(e);
    if (dragTarget === "image") setImagePos(p); else setTitlePos(p);
    setDragTarget(null);
    setDragPos(null);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const resetLayout = () => {
    setImagePos(DEFAULT_IMAGE_POS);
    setTitlePos(DEFAULT_TITLE_POS);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = debouncedUrl;
    a.download = `${exportSize}-${template}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    addToGallery(debouncedUrl);
  };

  const share = async () => {
    setSharing(true);
    try {
      const absoluteUrl = `${window.location.origin}${debouncedUrl}`;
      const res = await fetch(absoluteUrl);
      const blob = await res.blob();
      const file = new File([blob], `${exportSize}-${template}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: title || "استوری" });
      } else {
        await navigator.share({ title: title || "استوری", url: absoluteUrl });
      }
      addToGallery(debouncedUrl);
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("خطا در اشتراک‌گذاری");
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <ImagePlus className="w-6 h-6 text-accent-500" />
          گرافیک استوری خودکار
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          از داده‌های فروشگاهت یک عکس استوری آماده برای اینستاگرام بساز — بدون کنوا، بدون طراحی دستی.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
        {/* Form */}
        <div className="glass-card p-5 space-y-6 order-2 lg:order-1">
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">محتوا</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">محصول</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="input-base w-full"
              >
                <option value="custom">متن دلخواه (بدون محصول خاص)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProductId === "custom" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">عنوان</label>
                    <span className={`text-[11px] tabular-nums ${titleTooLong ? "text-amber-500 font-bold" : "text-gray-400"}`}>
                      {customTitle.length}/{maxTitleChars}
                    </span>
                  </div>
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className={`input-base w-full ${titleTooLong ? "!border-amber-500/50 focus:!border-amber-500" : ""}`}
                    placeholder="مثلاً: فروش ویژه پاییزه"
                  />
                  {titleTooLong && (
                    <p className="text-[11px] text-amber-500 mt-1.5">
                      ممکنه این عنوان در تصویر جا نشه — بهتره کوتاه‌ترش کنی یا اندازه فونت رو کم کنی
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">قیمت (تومان، اختیاری)</label>
                  <input
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value.replace(/\D/g, ""))}
                    className="input-base w-full"
                    placeholder="150000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">عکس محصول (اختیاری)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imgUploading}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all disabled:opacity-60 shrink-0"
                    >
                      {imgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      آپلود عکس
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                    <input
                      value={customImage}
                      onChange={(e) => setCustomImage(e.target.value)}
                      className="input-base w-full"
                      placeholder="یا آدرس عکس را بچسبان..."
                      dir="ltr"
                    />
                    {customImage && (
                      <button
                        type="button"
                        onClick={() => setCustomImage("")}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                        aria-label="حذف عکس"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {selectedProduct && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                قیمت اصلی: {formatPrice(selectedProduct.price)}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">درصد تخفیف (اختیاری)</label>
              <input
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value.replace(/\D/g, "").slice(0, 2))}
                className="input-base w-full"
                placeholder="0"
                dir="ltr"
              />
            </div>
          </section>

          <section className="space-y-4 pt-1 border-t border-gray-100 dark:border-white/5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide pt-4">ظاهر</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">اندازه خروجی</label>
              <div className="grid grid-cols-3 gap-2">
                {EXPORT_SIZES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setExportSize(s.key)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                      exportSize === s.key
                        ? "border-accent-500 bg-accent-500/10 text-accent-500"
                        : "border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                    <span className="text-[10px] opacity-70 tabular-nums">{s.ratioLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">فونت</label>
              <select value={font} onChange={(e) => setFont(e.target.value)} className="input-base w-full">
                <optgroup label="فارسی">
                  {FONT_OPTIONS.filter((f) => f.group === "fa").map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </optgroup>
                <optgroup label="English">
                  {FONT_OPTIONS.filter((f) => f.group === "en").map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                <span className="flex items-center gap-1.5"><Type className="w-3.5 h-3.5" /> اندازه عنوان</span>
                <span className="tabular-nums text-gray-400">{titleSize}px</span>
              </label>
              <input
                type="range"
                min={36}
                max={72}
                step={2}
                value={titleSize}
                onChange={(e) => setTitleSize(Number(e.target.value))}
                className="w-full accent-accent-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">مناسبت / قالب</label>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTemplate(t.key)}
                    className={`rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      template === t.key ? "border-accent-500 scale-[1.03] shadow-lg shadow-accent-500/10" : "border-transparent hover:border-white/20 hover:scale-[1.02]"
                    }`}
                  >
                    <div style={{ background: t.swatch }} className="h-16 w-full" />
                    <div className="text-[11px] font-bold py-1.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                      {t.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                <ImageIcon className="w-3.5 h-3.5" /> پس‌زمینه اختصاصی (به‌جای قالب) {!isPro && <ProLockBadge />}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (isPro ? bgInputRef.current?.click() : router.push("/dashboard/plans"))}
                  disabled={bgUploading}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 shrink-0 ${
                    isPro
                      ? "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300"
                      : "bg-gray-100/60 dark:bg-white/[0.03] text-gray-400"
                  }`}
                >
                  {bgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPro ? <UploadCloud className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  آپلود پس‌زمینه
                </button>
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleBgUpload(e.target.files[0])}
                />
                <p className="text-[11px] text-gray-400 flex-1">
                  {isPro ? (bgImage ? "پس‌زمینه اختصاصی فعاله" : "پیش‌فرض: قالب انتخابی بالا") : "عکس خودت رو به‌جای قالب‌های آماده بذار"}
                </p>
                {isPro && bgImage && (
                  <button
                    type="button"
                    onClick={() => setBgImage("")}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                    aria-label="حذف پس‌زمینه"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" /> کیفیت دانلود
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuality("normal")}
                  className={`py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                    quality === "normal"
                      ? "border-accent-500 bg-accent-500/10 text-accent-500"
                      : "border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  معمولی
                </button>
                <button
                  type="button"
                  onClick={() => (isPro ? setQuality("hd") : router.push("/dashboard/plans"))}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                    quality === "hd" && isPro
                      ? "border-accent-500 bg-accent-500/10 text-accent-500"
                      : "border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  HD {!isPro && <ProLockBadge />}
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-1 border-t border-gray-100 dark:border-white/5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide pt-4 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> برندسازی اختصاصی (Pro)
            </h2>

            {!isPro ? (
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">لوگوی اختصاصی، آیدی شبکه اجتماعی و حذف واترمارک فقط برای Pro</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">با ارتقا به Pro، استوری‌هات کاملاً برند خودت رو نشون می‌دن</p>
                </div>
                <Link href="/dashboard/plans" className="btn-primary py-2 px-4 text-xs shrink-0">
                  <Zap className="w-3.5 h-3.5" /> ارتقا
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">لوگوی اختصاصی استوری (اختیاری)</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all disabled:opacity-60 shrink-0"
                    >
                      {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      آپلود لوگو
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    />
                    <p className="text-[11px] text-gray-400 flex-1">
                      {customLogo ? "لوگوی سفارشی فعاله" : "پیش‌فرض: آواتار فروشگاهت"}
                    </p>
                    {customLogo && (
                      <button
                        type="button"
                        onClick={() => setCustomLogo("")}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                        aria-label="حذف لوگوی سفارشی"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                    <AtSign className="w-3.5 h-3.5" /> آیدی شبکه اجتماعی (اختیاری)
                  </label>
                  <input
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    className="input-base w-full"
                    placeholder="@yourshop"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">اگه پر بشه، به‌جای لینک weeelink.ir همین آیدی نشون داده می‌شه</p>
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideWatermark}
                    onChange={(e) => setHideWatermark(e.target.checked)}
                    className="w-4 h-4 accent-accent-500 rounded"
                  />
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                    <EyeOff className="w-3.5 h-3.5" /> حذف واترمارک «ساخته‌شده با ویلینک»
                  </span>
                </label>
              </>
            )}
          </section>

          <div className="flex items-center gap-2">
            <button
              onClick={download}
              disabled={previewLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> دانلود عکس
            </button>
            {canShare && (
              <button
                onClick={share}
                disabled={previewLoading || sharing}
                aria-label="اشتراک‌گذاری"
                className="flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="order-1 lg:order-2 flex flex-col items-center lg:items-start">
          <div className="sticky top-4">
            <div
              ref={previewBoxRef}
              className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl transition-all duration-300 select-none"
              style={{ width: currentSize.key === "story" ? 280 : 320, aspectRatio: currentSize.aspect, background: currentTemplate.swatch, touchAction: "none" }}
            >
              {displayedUrl && !previewError && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayedUrl}
                  alt="پیش‌نمایش استوری"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
                  style={{ opacity: previewLoading ? 0.5 : 1 }}
                />
              )}

              {!displayedUrl && !previewError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/70" />
                </div>
              )}

              {previewLoading && displayedUrl && (
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5 pointer-events-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                </div>
              )}

              {previewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 text-xs px-4 text-center">
                  <ImagePlus className="w-6 h-6" />
                  ساخت پیش‌نمایش با خطا مواجه شد
                </div>
              )}

              {/* Drag handles — image + title. Pointer Events unify mouse/touch. */}
              {!previewError && (
                <div
                  onPointerDown={onHandlePointerDown("image")}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onHandlePointerUp}
                  className="absolute w-11 h-11 -mt-[22px] -ml-[22px] rounded-full bg-white/90 border-2 border-accent-500 shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${dragTarget === "image" && dragPos ? dragPos.x : imagePos.x}%`,
                    top: `${dragTarget === "image" && dragPos ? dragPos.y : imagePos.y}%`,
                    opacity: dragTarget && dragTarget !== "image" ? 0.35 : 1,
                  }}
                  aria-label="جابجایی عکس"
                >
                  <Move className="w-4 h-4 text-accent-600" />
                </div>
              )}
              {!previewError && (
                <div
                  onPointerDown={onHandlePointerDown("title")}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onHandlePointerUp}
                  className="absolute flex items-center gap-1 px-2.5 py-1.5 -mt-[16px] rounded-full bg-black/70 border-2 border-white/80 shadow-lg text-white text-[10px] font-bold cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${dragTarget === "title" && dragPos ? dragPos.x : titlePos.x}%`,
                    top: `${dragTarget === "title" && dragPos ? dragPos.y : titlePos.y}%`,
                    transform: "translateX(-50%)",
                    opacity: dragTarget && dragTarget !== "title" ? 0.35 : 1,
                  }}
                  aria-label="جابجایی متن"
                >
                  <Move className="w-3 h-3" /> متن
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className="text-[11px] text-gray-400">دستگیره‌ها رو بکش تا عکس و متن رو جابجا کنی</p>
              <button
                type="button"
                onClick={resetLayout}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-accent-500 transition-colors shrink-0"
              >
                <RotateCcw className="w-3 h-3" /> بازنشانی چیدمان
              </button>
            </div>
          </div>

          {gallery.length > 0 && (
            <div className="mt-6 max-w-[320px] mx-auto lg:mx-0">
              <h3 className="text-xs font-bold text-gray-400 mb-2.5 flex items-center gap-1.5">
                <Images className="w-3.5 h-3.5" /> استوری‌های اخیر
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {gallery.map((g) => (
                  <div key={g.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-white/10" style={{ aspectRatio: "9/16" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeFromGallery(g.id)}
                      aria-label="حذف از تاریخچه"
                      className="absolute top-1 left-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <a
                      href={g.url}
                      download={`${g.ratio}-${g.template}.png`}
                      aria-label="دانلود دوباره"
                      className="absolute inset-x-0 bottom-0 py-1 bg-black/55 text-white text-[9px] font-bold text-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      دانلود
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
