"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Download, Loader2, ImagePlus, UploadCloud, X, Type } from "lucide-react";
import { productsApi, shopsApi, uploadApi } from "@/lib/api";
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

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "https://api.weeelink.ir";

// satori runs server-side and can't resolve site-relative paths (/uploads/...);
// every image url handed to the story-image route must be absolute.
function toAbsolute(url: string) {
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

export default function StoryGeneratorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedProductId, setSelectedProductId] = useState<string>("custom");
  const [customTitle, setCustomTitle] = useState("محصول ویژه");
  const [customPrice, setCustomPrice] = useState<string>("");
  const [customImage, setCustomImage] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("0");
  const [template, setTemplate] = useState("sale");
  const [titleSize, setTitleSize] = useState(56);

  const [imgUploading, setImgUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([productsApi.getAll(), shopsApi.getMine()])
      .then(([p, s]: any) => {
        setProducts(Array.isArray(p) ? p : []);
        setShop(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentTemplate = TEMPLATES.find((t) => t.key === template) || TEMPLATES[0];

  const title = selectedProduct ? selectedProduct.name : customTitle;
  const price = selectedProduct ? selectedProduct.price : customPrice ? Number(customPrice) : null;
  const image = selectedProduct ? selectedProduct.images?.[0] : customImage;

  const targetUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("template", template);
    params.set("title", title || "");
    params.set("titleSize", String(titleSize));
    if (price) params.set("price", String(price));
    if (Number(discountPercent) > 0) params.set("discountPercent", discountPercent);
    if (shop?.name) params.set("shopName", shop.name);
    if (shop?.slug) params.set("shopSlug", shop.slug);
    if (shop?.avatarUrl) params.set("shopLogo", toAbsolute(shop.avatarUrl));
    if (image) params.set("image", toAbsolute(image));
    return `/api/story-image?${params.toString()}`;
  }, [template, title, price, discountPercent, shop, image, titleSize]);

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

  const download = () => {
    const a = document.createElement("a");
    a.href = debouncedUrl;
    a.download = `story-${template}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">عنوان</label>
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="input-base w-full"
                    placeholder="مثلاً: فروش ویژه پاییزه"
                  />
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
          </section>

          <button
            onClick={download}
            disabled={previewLoading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> دانلود عکس استوری
          </button>
        </div>

        {/* Preview */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-start">
          <div className="sticky top-4">
            <div
              className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl"
              style={{ width: 280, aspectRatio: "9/16", background: currentTemplate.swatch }}
            >
              {displayedUrl && !previewError && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayedUrl}
                  alt="پیش‌نمایش استوری"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                  style={{ opacity: previewLoading ? 0.5 : 1 }}
                />
              )}

              {!displayedUrl && !previewError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/70" />
                </div>
              )}

              {previewLoading && displayedUrl && (
                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full p-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                </div>
              )}

              {previewError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 text-xs px-4 text-center">
                  <ImagePlus className="w-6 h-6" />
                  ساخت پیش‌نمایش با خطا مواجه شد
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-2">پیش‌نمایش زنده — با هر تغییر خودکار به‌روز می‌شود</p>
          </div>
        </div>
      </div>
    </div>
  );
}
