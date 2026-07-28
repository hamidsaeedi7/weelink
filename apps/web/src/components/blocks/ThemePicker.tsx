"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Sun, Moon } from "lucide-react";
import { BIO_THEMES, BIO_MODES, resolveBioBackground, isAtmospheric } from "@/lib/bio-theme";

// Renders the same background + [data-bio-theme]/[data-bio-mode] CSS variables
// as the public bio page, at a small scale and driven by the real shop data —
// a genuine live preview, not a screenshot. The background comes from the
// shared resolveBioBackground() so the preview cannot drift from the page.
function MiniPreview({ themeId, mode, shop }: { themeId: string; mode: string; shop: any }) {
  const primary = shop?.primaryColor || "#F97316";
  const background = resolveBioBackground(shop, themeId);
  const initial = (shop?.name || "و")[0];
  const isBento = themeId === "bento";

  return (
    <div
      data-bio-theme={themeId}
      data-bio-mode={mode}
      style={{ background }}
      className="w-full h-full flex flex-col items-center pt-3 px-2 gap-1 overflow-hidden"
    >
      <div
        className="w-7 h-7 rounded-full overflow-hidden border-2 shrink-0"
        style={{
          borderColor: `${primary}80`,
          boxShadow: isAtmospheric(themeId) ? `0 0 8px ${primary}50` : "none",
        }}
      >
        {shop?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primary}88)` }}
          >
            {initial}
          </div>
        )}
      </div>
      <div className="text-[8px] font-black truncate max-w-full" style={{ color: "var(--bio-text)" }}>
        {shop?.name || "فروشگاه من"}
      </div>

      {isBento ? (
        <div className="w-full grid grid-cols-2 gap-1 mt-0.5">
          <div className="bio-card col-span-2 h-3.5" style={{ borderRadius: "calc(var(--bio-radius) * 0.4)" }} />
          <div className="bio-card h-3.5" style={{ borderRadius: "calc(var(--bio-radius) * 0.4)" }} />
          <div className="bio-card h-3.5" style={{ borderRadius: "calc(var(--bio-radius) * 0.4)" }} />
        </div>
      ) : (
        <div className="w-full space-y-1 mt-0.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bio-card w-full h-3.5 flex items-center px-1.5"
              style={{ borderRadius: "calc(var(--bio-radius) * 0.5)" }}
            >
              <div
                className="w-full h-[2px] rounded-full"
                style={{ background: "var(--bio-text-secondary)", opacity: 0.5 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ThemePicker({
  shop,
  value,
  mode,
  onSelect,
  onSelectMode,
}: {
  shop: any;
  value: string;
  mode: string;
  onSelect: (id: string) => void;
  onSelectMode: (id: string) => void;
}) {
  // Collapsed by default: the picker is a set-once decision, and expanded it
  // pushed the actual block list (the reason sellers open this page) below
  // the fold on both mobile and desktop.
  const [open, setOpen] = useState(false);
  const currentTheme = BIO_THEMES.find((t) => t.id === value) || BIO_THEMES[0];
  const currentMode = BIO_MODES.find((m) => m.id === mode) || BIO_MODES[1];

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-3 w-full p-4 text-right transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        {/* Collapsed summary needs to answer "what is my page set to?" without
            expanding, so it carries a live thumbnail of the current choice. */}
        <div className="w-8 h-12 rounded-lg overflow-hidden shrink-0 border border-black/10 dark:border-white/10">
          <MiniPreview themeId={value} mode={mode} shop={shop} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">قالب صفحه بیو</h2>
          <p className="text-xs text-gray-500 truncate">
            {currentTheme.label} · {currentMode.label}
          </p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-black/5 dark:border-white/5 pt-3">
          {/* Light / dark switch — applies to whichever theme is selected */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">حالت رنگ:</span>
            <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
              {BIO_MODES.map((m) => {
                const Icon = m.id === "light" ? Sun : Moon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelectMode(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? "bg-accent-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            ظاهر کلی صفحه عمومی‌ات رو انتخاب کن — پیش‌نمایش زنده با اطلاعات خودت
          </p>

          {/* 3 per row on mobile, all 6 in a single row from lg up */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5">
            {BIO_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                  value === t.id
                    ? "border-accent-500 scale-[1.02] shadow-lg shadow-accent-500/10"
                    : "border-transparent hover:border-accent-500/40 hover:scale-[1.01]"
                }`}
                style={{ aspectRatio: "9/16" }}
              >
                <MiniPreview themeId={t.id} mode={mode} shop={shop} />
                {value === t.id && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 py-1 bg-black/65 text-[10px] font-bold text-white text-center">
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
