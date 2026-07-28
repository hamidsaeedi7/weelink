"use client";

import { useMemo, useState } from "react";
import { TEMPLATES, TEMPLATE_CATEGORIES, type StoryTemplate } from "@/lib/editor/templates";
import { uid } from "@/lib/editor/presets";
import { PagePreview } from "../PagePreview";

function TemplateThumb({ tpl }: { tpl: StoryTemplate }) {
  // Built once per template so the preview shows the real objects the
  // template would produce, not a hand-maintained approximation.
  const page = useMemo(
    () => ({ id: uid(), background: tpl.background, objects: tpl.build() }),
    [tpl],
  );
  return <PagePreview page={page} />;
}

export function TemplatePicker({ onApply }: { onApply: (tpl: StoryTemplate) => void }) {
  const [category, setCategory] = useState("all");
  const list = category === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              category === c.key
                ? "bg-accent-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {list.map((tpl) => (
          <button
            key={tpl.key}
            onClick={() => onApply(tpl)}
            title={tpl.label}
            className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-accent-500 hover:scale-[1.02] transition-all"
            style={{ aspectRatio: "9/16" }}
          >
            <TemplateThumb tpl={tpl} />
            <span className="absolute bottom-0 inset-x-0 py-1 bg-black/65 text-[9px] font-bold text-white text-center truncate px-1">
              {tpl.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
