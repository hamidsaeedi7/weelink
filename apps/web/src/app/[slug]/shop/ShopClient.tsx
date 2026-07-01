"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  stock: number;
  type: "PHYSICAL" | "DIGITAL";
}

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
      className="min-h-screen bg-gray-50 dark:bg-[#0A0A0F]"
      style={{ fontFamily: shop.fontFamily || "Vazirmatn" }}>
      {/* Shop Header */}
      <div className="bg-white dark:bg-black/20 border-b border-gray-100 dark:border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {shop.avatarUrl && (
            <Image src={shop.avatarUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
          )}
          <div className="flex-1">
            <h1 className="font-black text-gray-900 dark:text-white text-sm">{shop.name}</h1>
            <Link href={`/${slug}`} className="text-xs text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              بازگشت به صفحه اصلی
            </Link>
          </div>
          {count() > 0 && (
            <Link href={`/${slug}/checkout`}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl
                         bg-orange-500 text-white text-sm font-bold">
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
          <div className="text-center py-16 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>محصولی موجود نیست</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => {
              const qty = getQty(product.id);
              return (
                <div key={product.id}
                  className="bg-white dark:bg-white/5 rounded-2xl overflow-hidden
                             border border-gray-100 dark:border-white/5
                             hover:border-orange-500/30 transition-all group">
                  <div className="relative aspect-square cursor-pointer"
                    onClick={() => setSelected(product)}>
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill sizes="(max-width: 640px) 50vw, 300px"
                        className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-white/5">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    {product.type === "DIGITAL" && (
                      <span className="absolute top-2 right-2 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
                        دیجیتال
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-2">{product.name}</p>
                    <p className="text-xs font-black text-orange-500 mb-3">
                      {formatPrice(product.price)}
                    </p>
                    {qty === 0 ? (
                      <button
                        onClick={() => handleAdd(product)}
                        disabled={product.stock === 0}
                        className="w-full py-1.5 rounded-lg text-xs font-bold
                                   bg-orange-500 text-white hover:bg-orange-400
                                   disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {product.stock === 0 ? "ناموجود" : "افزودن"}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <button onClick={() => update(product.id, qty - 1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-black text-orange-500">{toPersianNumber(qty)}</span>
                        <button onClick={() => handleAdd(product)}
                          className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center hover:bg-orange-400 transition-all">
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
            className="flex items-center justify-between px-5 py-4 rounded-2xl
                       bg-orange-500 text-white shadow-[0_8px_30px_rgba(249,115,22,0.4)]">
            <span className="text-sm font-bold">{toPersianNumber(count())} محصول</span>
            <span className="font-black">پرداخت {formatPrice(total())}</span>
          </Link>
        </div>
      )}

      {/* Product Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-[#111] rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            {selected.images[0] && (
              <div className="relative w-full aspect-video">
                <Image src={selected.images[0]} alt="" fill sizes="384px" className="object-cover" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <h3 className="font-black text-gray-900 dark:text-white">{selected.name}</h3>
              {selected.description && (
                <p className="text-sm text-gray-500">{selected.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="font-black text-orange-500 text-lg">{formatPrice(selected.price)}</span>
                <button onClick={() => { handleAdd(selected); setSelected(null); }}
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all">
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
