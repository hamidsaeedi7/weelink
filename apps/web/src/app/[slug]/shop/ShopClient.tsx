"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, Package, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import { toast } from "sonner";
import { resolveBioBackground } from "@/lib/bio-theme";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  type: "PHYSICAL" | "DIGITAL";
}

const textStyle = { color: "var(--bio-text)" };
const secondaryStyle = { color: "var(--bio-text-secondary)" };

export default function ShopClient({
  shop,
  products,
  slug,
}: {
  shop: any;
  products: Product[];
  slug: string;
}) {
  const { add, items, update, remove, count, total } = useCart();
  const [selected, setSelected] = useState<Product | null>(null);

  const primary = shop.primaryColor || "#F97316";
  const theme = shop.bioTheme || "modern";
  const mode = shop.bioMode || "dark";
  const background = resolveBioBackground(shop, theme);

  const getQty = (id: string) => items.find((i) => i.productId === id)?.qty || 0;

  const handleAdd = (product: Product) => {
    add(
      { productId: product.id, name: product.name, price: product.price, image: product.images[0] },
      slug,
    );
    toast.success(`${product.name} به سبد اضافه شد`);
  };

  return (
    <div
      data-bio-theme={theme}
      data-bio-mode={mode}
      className="min-h-screen"
      style={{ background, fontFamily: `'${shop.fontFamily || "Vazirmatn"}', Vazirmatn, sans-serif` }}>
      {/* Shop Header */}
      <div className="bio-card sticky top-0 z-20 !rounded-none !border-x-0 !border-t-0">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {shop.avatarUrl && (
            <Image src={shop.avatarUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
          )}
          <div className="flex-1">
            <h1 className="font-black text-sm" style={textStyle}>{shop.name}</h1>
            <Link href={`/${slug}`} className="text-xs transition-colors flex items-center gap-1" style={secondaryStyle}>
              <ArrowRight className="w-3 h-3" />
              بازگشت به صفحه اصلی
            </Link>
          </div>
          {count() > 0 && (
            <Link href={`/${slug}/checkout`}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-bold"
              style={{ background: primary }}>
              <ShoppingCart className="w-4 h-4" />
              <span>{toPersianNumber(count())}</span>
              <span className="hidden sm:inline">سبد خرید</span>
            </Link>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {products.length === 0 ? (
          <div className="text-center py-16" style={secondaryStyle}>
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>محصولی موجود نیست</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => {
              const qty = getQty(product.id);
              return (
                <div key={product.id} className="bio-card overflow-hidden transition-all group">
                  <div className="relative aspect-square cursor-pointer"
                    onClick={() => setSelected(product)}>
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bio-card-hover-bg)" }}>
                        <Package className="w-8 h-8 opacity-30" style={secondaryStyle} />
                      </div>
                    )}
                    {product.type === "DIGITAL" && (
                      <span className="absolute top-2 right-2 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
                        دیجیتال
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold line-clamp-2 mb-2" style={textStyle}>{product.name}</p>
                    <p className="text-xs font-black mb-3" style={{ color: primary }}>
                      {formatPrice(product.price)}
                    </p>
                    {qty === 0 ? (
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={product.stock === 0}
                        className="w-full py-1.5 rounded-lg text-xs font-bold text-white
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        style={{ background: primary }}>
                        {product.stock === 0 ? "ناموجود" : "افزودن"}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button onClick={() => update(product.id, qty - 1)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white transition-all"
                          style={{ background: "var(--bio-card-hover-bg)", color: "var(--bio-text)" }}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-black" style={{ color: primary }}>{toPersianNumber(qty)}</span>
                        <button onClick={() => handleAdd(product)}
                          className="w-7 h-7 rounded-lg text-white flex items-center justify-center transition-all"
                          style={{ background: primary }}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {count() > 0 && (
        <div className="fixed bottom-4 right-4 left-4 max-w-md mx-auto z-30">
          <Link href={`/${slug}/checkout`}
            className="flex items-center justify-between px-5 py-4 rounded-2xl text-white shadow-2xl"
            style={{ background: primary, boxShadow: `0 8px 30px ${primary}66` }}>
            <span className="text-sm font-bold">{toPersianNumber(count())} محصول</span>
            <span className="font-black">پرداخت {formatPrice(total())}</span>
          </Link>
        </div>
      )}

      {/* Product Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
          onClick={() => setSelected(null)}>
          <div className="bio-card w-full max-w-sm overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} aria-label="بستن"
              className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-black/40 text-white">
              <X className="w-4 h-4" />
            </button>
            {selected.images[0] && (
              <div className="relative w-full aspect-video">
                <Image src={selected.images[0]} alt="" fill sizes="384px" className="object-cover" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <h3 className="font-black" style={textStyle}>{selected.name}</h3>
              {selected.description && (
                <p className="text-sm" style={secondaryStyle}>{selected.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="font-black text-lg" style={{ color: primary }}>{formatPrice(selected.price)}</span>
                <button onClick={() => { handleAdd(selected); setSelected(null); }}
                  className="px-5 py-2 rounded-xl text-white font-bold text-sm transition-all"
                  style={{ background: primary }}>
                  افزودن به سبد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
