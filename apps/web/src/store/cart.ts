import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface CartStore {
  items: CartItem[];
  shopSlug: string | null;
  add: (item: Omit<CartItem, "qty">, slug: string) => void;
  remove: (productId: string) => void;
  update: (productId: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      shopSlug: null,

      add: (item, slug) => {
        const { items, shopSlug } = get();
        // Clear cart if switching shops
        if (shopSlug && shopSlug !== slug) {
          set({ items: [{ ...item, qty: 1 }], shopSlug: slug });
          return;
        }
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i,
            ),
            shopSlug: slug,
          });
        } else {
          set({ items: [...items, { ...item, qty: 1 }], shopSlug: slug });
        }
      },

      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      update: (productId, qty) => {
        if (qty <= 0) {
          get().remove(productId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        }));
      },

      clear: () => set({ items: [], shopSlug: null }),

      total: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
      count: () => get().items.reduce((s, i) => s + i.qty, 0),
    }),
    { name: "weelink-cart" },
  ),
);
