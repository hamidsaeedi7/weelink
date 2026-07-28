"use client";

import { useMemo, useState } from "react";
import { TEMPLATES, TEMPLATE_CATEGORIES, projectFromTemplate, type StoryTemplate } from "@/lib/editor/templates";
import type { Background } from "@/lib/editor/types";

function bgCss(bg: Background): string {
  if (bg.type === "solid") return bg.color;
  if (bg.type === "gradient") return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
  return "#111";
}

/**
 * Thumbnails are rendered as plain DOM, not by mounting a Konva stage per
 * card. Twelve live stages would be far heavier than the preview is worth,
 * and the approximation only has to communicate the layout.
 */
function TemplateThumb({ tpl }: { tpl: StoryTemplate }) {
  const objects = useMemo(() => tpl.build(), [tpl]);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bgCss(tpl.background) }}>
      {objects.map((o) => {
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${(o.x / 1080) * 100}%`,
          top: `${(o.y / 1920) * 100}%`,
          width: `${(o.width / 1080) * 100}%`,
          height: `${(o.height / 1920) * 100}%`,
          opacity: o.opacity,
        };
        if (o.type === "text") {
          return (
            <div
              key={o.id}
              style={{
                ...style,
                color: o.fill,
                // Scale the real font size into thumbnail space so the
                // hierarchy of the design still reads at this size.
                fontSize: `${(o.fontSize / 1920) * 100 * 1.6}cqh`,
                fontFamily: o.fontFamily,
                fontWeight: o.fontWeight,
                textAlign: o.align,
                direction: o.direction,
                lineHeight: o.lineHeight,
                overflow: "hidden",
              }}
            >
              {o.text}
            </div>
          );
        }
        if (o.type === "shape") {
          return (
            <div
              key={o.id}
              style={{
                ...style,
                background: o.fill,
                borderRadius: o.shape === "ellipse" ? "50%" : `${((o.cornerRadius ?? 0) / 1080) * 100}%`,
              }}
            />
          );
        }
        return null;
      })}
    </div>
  );
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

      <div className="grid grid-cols-3 gap-2">
        {list.map((tpl) => (
          <button
            key={tpl.key}
            onClick={() => onApply(tpl)}
            title={tpl.label}
            className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-accent-500 hover:scale-[1.02] transition-all"
            style={{ aspectRatio: "9/16", containerType: "size" }}
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
