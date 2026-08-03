"use client";

import { useState } from "react";
import { Crown, Loader2, X, Check, Layers, Plus } from "lucide-react";
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/page-templates";
import { BioPreview } from "./BioPreview";

/**
 * Thumbnail = the real page, scaled.
 *
 * The card renders the template's actual blocks through the same renderer the
 * public page uses and shrinks the result with a transform, so a thumbnail can
 * never promise a layout the template does not produce. `transform-origin` is
 * top-right because the page is RTL.
 */
const THUMB_WIDTH = 360;

function TemplateThumb({ template, shop }: { template: PageTemplate; shop: any }) {
  const scale = 0.42;
  const blocks = template.blocks.map((b, i) => ({ ...b, id: `t${i}`, isActive: true }));
  const previewShop = {
    ...shop,
    bioTheme: template.theme,
    bioMode: template.mode,
    primaryColor: template.primaryColor,
    // Templates set their own backdrop; a seller's uploaded background photo
    // would hide the layout the card is meant to show.
    bgImageUrl: undefined,
    bgTemplate: undefined,
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div style={{ width: THUMB_WIDTH, transform: `scale(${scale})`, transformOrigin: "top right" }}>
        <BioPreview shop={previewShop} blocks={blocks} products={[]} />
      </div>
    </div>
  );
}

// ─── Apply confirmation ───────────────────────────────────────────────────────

function ApplyModal({
  template, hasBlocks, applying, onApply, onClose,
}: {
  template: PageTemplate;
  hasBlocks: boolean;
  applying: boolean;
  onApply: (mode: "replace" | "append") => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"replace" | "append">(hasBlocks ? "append" : "replace");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`اعمال قالب ${template.label}`}
        className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-[#111122]
                   border border-gray-200 dark:border-white/[0.08]
                   rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-fade-up
                   pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.06]">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">اعمال قالب «{template.label}»</h3>
          <button onClick={onClose} aria-label="بستن" className="p-2 rounded-lg text-gray-500 hover:bg-black/5 dark:hover:bg-white/5">
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            این قالب {template.blocks.length} بلوک آماده می‌سازد که بعداً می‌توانی همه‌شان را ویرایش کنی.
          </p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
            متن‌ها، قیمت‌ها و اعداد داخل قالب فقط نمونه‌اند — قبل از انتشار حتماً با اطلاعات واقعی
            کسب‌وکارت جایگزین‌شان کن.
          </p>

          {hasBlocks && (
            <div className="space-y-2">
              {([
                ["append", "افزودن به انتها", "بلوک‌های فعلی حفظ می‌شوند و قالب زیرشان اضافه می‌شود"],
                ["replace", "جایگزینی کامل", "بلوک‌های فعلی حذف می‌شوند و ظاهر صفحه هم به قالب تغییر می‌کند"],
              ] as const).map(([id, title, desc]) => (
                <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id}
                  className={`flex items-start gap-2.5 w-full p-3 rounded-xl border text-right transition-all
                              ${mode === id
                                ? "border-accent-500 bg-accent-500/[0.07]"
                                : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"}`}>
                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                                    ${mode === id ? "border-accent-500" : "border-gray-300 dark:border-white/20"}`}>
                    {mode === id && <span className="w-2 h-2 rounded-full bg-accent-500" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-gray-900 dark:text-white">{title}</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] text-gray-500 leading-relaxed">
            نگران نباش — بعد از اعمال، دکمهٔ «بازگردانی» نمایش داده می‌شود و می‌توانی همه‌چیز را به حالت قبل برگردانی.
          </p>
        </div>

        <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-white/[0.06]">
          <button onClick={onClose}
            className="flex-1 min-h-[2.75rem] rounded-xl text-sm text-gray-600 dark:text-gray-400
                       border border-gray-200 dark:border-white/10">
            انصراف
          </button>
          <button onClick={() => onApply(mode)} disabled={applying} className="btn-primary flex-1 !py-2.5 text-sm">
            {applying ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Check aria-hidden="true" className="w-4 h-4" />}
            اعمال قالب
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export function TemplateGallery({
  shop, hasBlocks, isPro, onApply,
}: {
  shop: any;
  hasBlocks: boolean;
  isPro: boolean;
  onApply: (template: PageTemplate, mode: "replace" | "append") => Promise<void>;
}) {
  const [picked, setPicked] = useState<PageTemplate | null>(null);
  const [applying, setApplying] = useState(false);

  const handleApply = async (mode: "replace" | "append") => {
    if (!picked) return;
    setApplying(true);
    try {
      await onApply(picked, mode);
      setPicked(null);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5">
        <Layers aria-hidden="true" className="w-5 h-5 text-accent-700 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          یک قالب آماده را انتخاب کن تا صفحه‌ات در چند ثانیه ساخته شود. همهٔ متن‌ها، تصویرها و
          رنگ‌ها بعد از اعمال قابل ویرایش‌اند.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {PAGE_TEMPLATES.map((t) => {
          const locked = t.isPro && !isPro;
          return (
            <button
              key={t.id}
              onClick={() => setPicked(t)}
              className="group text-right rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10
                         hover:border-accent-500/50 transition-all focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <div className="relative w-full bg-gray-100 dark:bg-white/5" style={{ aspectRatio: "9/14" }}>
                <TemplateThumb template={t} shop={shop} />
                {locked && (
                  <span className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-lg
                                   bg-amber-500 text-[10px] font-black text-amber-950">
                    <Crown aria-hidden="true" className="w-3 h-3" />
                    Pro
                  </span>
                )}
                <span className="absolute inset-0 z-10 flex items-center justify-center
                                 bg-black/0 group-hover:bg-black/35 transition-colors">
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-gray-900
                                   text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                    استفاده از این قالب
                  </span>
                </span>
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{t.label}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px] bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                    {t.industry}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {picked && (
        <ApplyModal
          template={picked}
          hasBlocks={hasBlocks}
          applying={applying}
          onApply={handleApply}
          onClose={() => setPicked(null)}
        />
      )}
    </div>
  );
}
