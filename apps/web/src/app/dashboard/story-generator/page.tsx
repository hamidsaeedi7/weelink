"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, Loader2, ImagePlus } from "lucide-react";
import { productsApi, shopsApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

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

  const title = selectedProduct ? selectedProduct.name : customTitle;
  const price = selectedProduct ? selectedProduct.price : customPrice ? Number(customPrice) : null;
  const image = selectedProduct ? selectedProduct.images?.[0] : customImage;

  const imageUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("template", template);
    params.set("title", title || "");
    if (price) params.set("price", String(price));
    if (Number(discountPercent) > 0) params.set("discountPercent", discountPercent);
    if (shop?.name) params.set("shopName", shop.name);
    if (shop?.slug) params.set("shopSlug", shop.slug);
    if (shop?.avatarUrl) {
      const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "https://api.weeelink.ir";
      params.set("shopLogo", shop.avatarUrl.startsWith("http") ? shop.avatarUrl : `${apiOrigin}${shop.avatarUrl}`);
    }
    if (image) params.set("image", image);
    return `/api/story-image?${params.toString()}`;
  }, [template, title, price, discountPercent, shop, image]);

  const download = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
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
        <div className="glass-card p-5 space-y-5 order-2 lg:order-1">
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
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">آدرس عکس (اختیاری)</label>
                <input
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  className="input-base w-full"
                  placeholder="https://..."
                  dir="ltr"
                />
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

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">مناسبت / قالب</label>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTemplate(t.key)}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    template === t.key ? "border-accent-500 scale-[1.03]" : "border-transparent hover:border-white/20"
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

          <button
            onClick={download}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-400 text-white text-sm font-bold rounded-xl transition-all"
          >
            <Download className="w-4 h-4" /> دانلود عکس استوری
          </button>
        </div>

        {/* Preview */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-start">
          <div className="sticky top-4">
            <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl" style={{ width: 280, aspectRatio: "9/16" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={imageUrl} src={imageUrl} alt="پیش‌نمایش استوری" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
