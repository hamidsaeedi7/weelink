"use client";

import { Copy, Crown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import type { Background } from "@/lib/editor/types";

/** Multi-page stories (carousels) are a Pro feature — free stays single-page. */
const FREE_PAGE_LIMIT = 1;

function bgCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  if (bg.type === "gradient") return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
  return "#111";
}

/**
 * Page navigator. Horizontal on both breakpoints — a story sequence is
 * naturally ordered left-to-right (well, right-to-left here), and a
 * horizontal strip reads the same on a phone and a desktop.
 */
export function PageStrip({ isPro }: { isPro: boolean }) {
  const doc = useEditor((s) => s.doc);
  const activePageId = useEditor((s) => s.activePageId);
  const setActivePage = useEditor((s) => s.setActivePage);
  const addPage = useEditor((s) => s.addPage);
  const duplicatePage = useEditor((s) => s.duplicatePage);
  const removePage = useEditor((s) => s.removePage);

  const canDelete = doc.pages.length > 1;
  const canAddPage = isPro || doc.pages.length < FREE_PAGE_LIMIT;
  const blockAdd = () => toast.error("چندصفحه‌ای بودن استوری فقط در پلن Pro در دسترس است");

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2 py-2">
      {doc.pages.map((page, i) => {
        const active = page.id === activePageId;
        return (
          <div key={page.id} className="relative group shrink-0">
            <button
              onClick={() => setActivePage(page.id)}
              className={`relative block w-[42px] rounded-lg overflow-hidden border-2 transition-all ${
                active ? "border-accent-500" : "border-transparent hover:border-accent-500/40"
              }`}
              style={{ aspectRatio: "9/16", background: bgCss(page.background) }}
              aria-label={`صفحه ${i + 1}`}
              aria-current={active}
            >
              {/* Object density is enough of a hint at this size. */}
              {page.objects.slice(0, 4).map((o) => (
                <span
                  key={o.id}
                  className="absolute bg-white/45 rounded-[1px]"
                  style={{
                    left: `${(o.x / 1080) * 100}%`,
                    top: `${(o.y / 1920) * 100}%`,
                    width: `${(o.width / 1080) * 100}%`,
                    height: `${Math.max(2, (o.height / 1920) * 100)}%`,
                  }}
                />
              ))}
              <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold text-white bg-black/50 tabular-nums">
                {i + 1}
              </span>
            </button>

            <div className="absolute -top-1 -left-1 flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                onClick={() => (canAddPage ? duplicatePage(page.id) : blockAdd())}
                aria-label="تکثیر صفحه"
                className="p-0.5 rounded bg-black/70 text-white hover:bg-black"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
              {canDelete && (
                <button
                  onClick={() => removePage(page.id)}
                  aria-label="حذف صفحه"
                  className="p-0.5 rounded bg-black/70 text-white hover:bg-red-500"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => (canAddPage ? addPage() : blockAdd())}
        aria-label="افزودن صفحه"
        className="relative shrink-0 w-[42px] rounded-lg border-2 border-dashed border-gray-300 dark:border-white/15 flex items-center justify-center text-gray-400 hover:border-accent-500 hover:text-accent-500 transition-colors"
        style={{ aspectRatio: "9/16" }}
      >
        {!canAddPage && (
          <span className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-accent-500 flex items-center justify-center">
            <Crown className="w-2 h-2 text-white" />
          </span>
        )}
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
