"use client";

import { useState } from "react";
import { Loader2, LayoutTemplate, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TEMPLATES, type Template } from "./templates-data";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

export default function TemplatesPage() {
  const [applying, setApplying] = useState<string | null>(null);
  const [preview, setPreview] = useState<Template | null>(null);
  const router = useRouter();

  const applyTemplate = async (tpl: Template) => {
    if (applying) return;
    if (tpl.id === "blank") {
      router.push("/dashboard/blocks");
      return;
    }

    setApplying(tpl.id);
    try {
      // Replace current blocks with the template's blocks.
      const res = await fetch(`${API}/api/v1/blocks`, { headers: auth() }).then((r) => r.json());
      const existing = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      await Promise.all(existing.map((b: any) =>
        fetch(`${API}/api/v1/blocks/${b.id}`, { method: "DELETE", headers: auth() })
      ));
      for (let i = 0; i < tpl.blocks.length; i++) {
        const blk = tpl.blocks[i];
        const r = await fetch(`${API}/api/v1/blocks`, {
          method: "POST",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({
            type: blk.type,
            label: blk.label,
            url: blk.url,
            icon: blk.icon,
            data: blk.data ?? {},
            sortOrder: i,
          }),
        });
        if (!r.ok) throw new Error();
      }
      toast.success("قالب اعمال شد!");
      router.push("/dashboard/blocks");
    } catch {
      toast.error("خطا در اعمال قالب");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">قالب‌های حرفه‌ای</h1>
        <p className="text-sm text-gray-500">پیش‌نمایش ببینید و با یک کلیک صفحهٔ بیوی آمادهٔ شغل‌تان را بسازید</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id}
            className="glass-card overflow-hidden group cursor-pointer hover:border-orange-500/30 transition-all"
            onClick={() => (tpl.id === "blank" ? applyTemplate(tpl) : setPreview(tpl))}>
            <div className={`h-28 bg-gradient-to-br ${tpl.color} flex items-center justify-center text-5xl transition-transform group-hover:scale-105`}>
              {tpl.emoji}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tpl.label}</h3>
                {tpl.blocks.length > 0 && (
                  <span className="text-xs text-gray-400">{tpl.blocks.length} بلوک</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{tpl.desc}</p>

              {tpl.blocks.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.blocks.slice(0, 3).map((b, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-md">
                      {b.type}
                    </span>
                  ))}
                  {tpl.blocks.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{tpl.blocks.length - 3}</span>
                  )}
                </div>
              )}

              <button
                disabled={applying === tpl.id}
                className="w-full mt-2 py-2 rounded-xl text-sm font-medium transition-all
                           border border-gray-200 dark:border-white/10
                           hover:text-white hover:border-transparent"
                style={{ background: applying === tpl.id ? "#F97316" : "" }}
                onClick={(e) => { e.stopPropagation(); tpl.id === "blank" ? applyTemplate(tpl) : setPreview(tpl); }}>
                {applying === tpl.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> در حال اعمال...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    {tpl.id === "blank"
                      ? <><Check className="w-3.5 h-3.5" /> شروع از صفر</>
                      : <><Eye className="w-3.5 h-3.5" /> پیش‌نمایش و انتخاب</>}
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPreview(null)}>
          <div className="bg-[#0D0D18] border border-white/10 rounded-3xl w-full max-w-sm max-h-[92vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-lg">{preview.emoji}</span>
                <h3 className="font-bold text-white text-sm">{preview.label}</h3>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* phone-frame preview */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#0A0A0F]">
              <div className="mx-auto max-w-[320px] space-y-3">
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${preview.color} flex items-center justify-center text-3xl`}>
                    {preview.emoji}
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">{preview.label}</p>
                  <p className="text-xs text-white/40">{preview.desc}</p>
                </div>
                {preview.blocks.map((b, i) => (
                  <BlockRenderer key={i} block={{ id: `preview-${i}`, ...b }} primaryColor={preview.accentColor} />
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-white/[0.06] flex gap-2">
              <button onClick={() => setPreview(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:bg-white/5">
                انصراف
              </button>
              <button
                disabled={applying === preview.id}
                onClick={() => { const t = preview; setPreview(null); applyTemplate(t); }}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {applying === preview.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                استفاده از این قالب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
