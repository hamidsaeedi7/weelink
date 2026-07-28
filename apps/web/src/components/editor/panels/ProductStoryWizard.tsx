"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, UploadCloud, Wand2, X } from "lucide-react";
import { productsApi, uploadApi } from "@/lib/api";
import { STORY_STYLES, buildProductStory, discountOf, type ProductStoryInput } from "@/lib/editor/productStory";
import type { Project } from "@/lib/editor/types";
import { PagePreview } from "../PagePreview";
import { toast } from "sonner";

/**
 * Uploads are stored as site-relative paths like /uploads/images/x.png.
 *
 * Do NOT rewrite these onto the API origin: api.weeelink.ir does not serve
 * /uploads — only the web origin does, through the Next rewrite. Keeping the
 * path relative also means it stays same-origin, so the canvas is never
 * tainted and export keeps working, and the saved project stays portable
 * across domains.
 */
const toCanvasSrc = (url: string) => url;

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
}

const OCCASIONS = ["", "فروش ویژه", "تازه رسید", "پیشنهاد شگفت‌انگیز", "حراج پایان فصل", "شب یلدا", "عید نوروز"];

export function ProductStoryWizard({ onPick }: { onPick: (project: Project) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [handle, setHandle] = useState("");
  const [cta, setCta] = useState("همین حالا سفارش بده");
  const [occasion, setOccasion] = useState("فروش ویژه");

  useEffect(() => {
    productsApi
      .getAll()
      .then((p: any) => setProducts(Array.isArray(p) ? p : []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, []);

  /** Prefills from an existing product — the seller already typed this once. */
  const useProduct = (p: Product) => {
    setName(p.name);
    setOldPrice(String(p.price));
    setNewPrice("");
    if (p.images?.[0]) setImageSrc(toCanvasSrc(p.images[0]));
    toast.success("اطلاعات محصول پر شد");
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setImageSrc(toCanvasSrc(await uploadApi.image(file)));
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  };

  const input: ProductStoryInput = useMemo(
    () => ({
      name: name.trim() || "نام محصول",
      imageSrc: imageSrc || undefined,
      oldPrice: oldPrice ? Number(oldPrice) : null,
      newPrice: newPrice ? Number(newPrice) : null,
      handle: handle.trim() || undefined,
      cta: cta.trim() || undefined,
      occasion: occasion || undefined,
    }),
    [name, imageSrc, oldPrice, newPrice, handle, cta, occasion],
  );

  // Regenerated live as the form changes, so the seller sees the effect of
  // every field immediately instead of after a "generate" round trip.
  const variants = useMemo(
    () => STORY_STYLES.map((style) => ({ style, project: buildProductStory(input, style) })),
    [input],
  );

  const discount = discountOf(input);

  return (
    <div className="space-y-4">
      {/* Pick from the shop's own products */}
      {loadingProducts ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
        </div>
      ) : products.length > 0 ? (
        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">از محصولات فروشگاهت</span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {products.slice(0, 12).map((p) => (
              <button
                key={p.id}
                onClick={() => useProduct(p)}
                title={p.name}
                className="shrink-0 w-16 rounded-xl overflow-hidden border-2 border-transparent hover:border-accent-500 transition-all bg-gray-100 dark:bg-white/5"
                style={{ aspectRatio: "1/1" }}
              >
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-[9px] text-gray-400 px-1 text-center">{p.name}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Fields */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-2">
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">نام محصول</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: کیف چرم دست‌دوز" className="input-base w-full" />
        </div>

        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">قیمت قبلی</span>
          <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value.replace(/\D/g, ""))} placeholder="۲۵۰۰۰۰" dir="ltr" className="input-base w-full" />
        </div>
        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">قیمت جدید</span>
          <input value={newPrice} onChange={(e) => setNewPrice(e.target.value.replace(/\D/g, ""))} placeholder="۱۹۹۰۰۰" dir="ltr" className="input-base w-full" />
        </div>

        <div className="col-span-2">
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">مناسبت</span>
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="input-base w-full">
            {OCCASIONS.map((o) => (
              <option key={o || "none"} value={o}>{o || "بدون مناسبت"}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">آیدی اینستاگرام</span>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@yourshop" dir="ltr" className="input-base w-full" />
        </div>
        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">دعوت به اقدام</span>
          <input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="همین حالا سفارش بده" className="input-base w-full" />
        </div>

        <div className="col-span-2">
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">تصویر محصول</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all cursor-pointer shrink-0">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              آپلود
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            </label>
            {imageSrc && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageSrc} alt="" className="w-9 h-9 rounded-lg object-cover" />
                <button onClick={() => setImageSrc("")} aria-label="حذف تصویر" className="p-2 rounded-lg text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
            {discount !== null && (
              <span className="mr-auto text-[11px] font-bold text-accent-600 dark:text-accent-400">
                {discount.toLocaleString("fa-IR")}٪ تخفیف محاسبه شد
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Generated variants */}
      <div>
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-accent-500" />
          یکی را انتخاب کن — بعدش کاملاً قابل ویرایش است
        </span>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {variants.map(({ style, project }) => (
            <button
              key={style.key}
              onClick={() => onPick(buildProductStory(input, style))}
              title={style.label}
              className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-accent-500 hover:scale-[1.02] transition-all"
              style={{ aspectRatio: "9/16" }}
            >
              <PagePreview page={project.pages[0]} />
              <span className="absolute bottom-0 inset-x-0 py-1 bg-black/65 text-[9px] font-bold text-white text-center truncate px-1">
                {style.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
