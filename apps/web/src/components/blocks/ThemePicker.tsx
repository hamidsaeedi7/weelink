"use client";

import { CheckCircle2 } from "lucide-react";
import { getBgTemplate, bgTemplateBackground } from "@/lib/bg-templates";

const THEMES = [
  { id: "modern", label: "مدرن" },
  { id: "glass", label: "گلس‌مورفیسم" },
  { id: "minimal", label: "مینیمال" },
  { id: "classic", label: "کلاسیک" },
];

// Renders the exact same background-resolution logic as the public bio page
// (BioPageClient) at a small scale, driven by the real shop data + the same
// [data-bio-theme] CSS variables — a genuine live preview, not a screenshot.
function MiniPreview({ themeId, shop }: { themeId: string; shop: any }) {
  const primary = shop?.primaryColor || "#F97316";
  const isMinimal = themeId === "minimal";
  const isClassic = themeId === "classic";
  const bg = shop?.bgImageUrl;
  const template = !bg ? getBgTemplate(shop?.bgTemplate) : undefined;
  const background = isMinimal
    ? "#fafafa"
    : isClassic
      ? "#101012"
      : bg
        ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bg}) center/cover no-repeat`
        : template
          ? bgTemplateBackground(template)
          : `linear-gradient(160deg, #0A0A0F 0%, #111122 100%)`;

  const initial = (shop?.name || "و")[0];

  return (
    <div data-bio-theme={themeId} style={{ background }} className="w-full h-full flex flex-col items-center pt-4 px-2.5 gap-1.5 overflow-hidden">
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: `${primary}80` }}>
        {shop?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}88)` }}>
            {initial}
          </div>
        )}
      </div>
      <div className="text-[9px] font-black truncate max-w-full" style={{ color: "var(--bio-text)" }}>{shop?.name || "فروشگاه من"}</div>
      <div className="w-full space-y-1.5 mt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bio-card w-full h-4 flex items-center px-1.5" style={{ borderRadius: "calc(var(--bio-radius) * 0.5)" }}>
            <div className="w-full h-[3px] rounded-full" style={{ background: "var(--bio-text-secondary)", opacity: 0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThemePicker({ shop, value, onSelect }: { shop: any; value: string; onSelect: (id: string) => void }) {
  return (
    <div className="glass-card p-4">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">قالب صفحه بیو</h2>
      <p className="text-xs text-gray-500 mb-3">ظاهر کلی صفحه عمومی‌ات رو انتخاب کن — پیش‌نمایش زنده با اطلاعات خودت</p>
      <div className="grid grid-cols-4 gap-2.5">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
              value === t.id ? "border-accent-500 scale-[1.02] shadow-lg shadow-accent-500/10" : "border-transparent hover:border-white/20 hover:scale-[1.01]"
            }`}
            style={{ aspectRatio: "9/16" }}
          >
            <MiniPreview themeId={t.id} shop={shop} />
            {value === t.id && (
              <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-accent-500 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="absolute bottom-0 inset-x-0 py-1 bg-black/65 text-[10px] font-bold text-white text-center">{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
