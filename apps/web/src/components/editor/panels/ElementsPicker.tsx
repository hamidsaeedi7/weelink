"use client";

import { useState } from "react";
import { ELEMENTS, ELEMENT_CATEGORIES, type ElementDef } from "@/lib/editor/elements";
import type { EditorObject } from "@/lib/editor/types";

function Thumb({ el }: { el: ElementDef }) {
  const p = el.preview;
  if (p.kind === "icon") {
    return (
      <span
        className="w-7 h-7 text-gray-700 dark:text-gray-200"
        // Inline SVG uses currentColor so the icon follows the theme in the
        // picker, while the object added to the canvas gets a baked colour.
        dangerouslySetInnerHTML={{ __html: p.svg ?? "" }}
      />
    );
  }
  if (p.kind === "frame") {
    return <span className="w-8 h-10 rounded-md border-2" style={{ borderColor: p.color }} />;
  }
  if (p.kind === "shape") {
    return <span className="w-8 h-5 rounded" style={{ background: p.color }} />;
  }
  return (
    <span
      className="px-2 py-1 rounded-full text-[9px] font-black truncate max-w-full"
      style={{ background: p.color, color: p.color === "#FFFFFF" || p.color === "#FACC15" ? "#0F172A" : "#fff" }}
    >
      {p.text}
    </span>
  );
}

export function ElementsPicker({ onAdd }: { onAdd: (objects: EditorObject[]) => void }) {
  const [category, setCategory] = useState("badge");
  const list = ELEMENTS.filter((e) => e.category === category);

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {ELEMENT_CATEGORIES.map((c) => (
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

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {list.map((el) => (
          <button
            key={el.key}
            onClick={() => onAdd(el.build())}
            title={el.label}
            className="flex flex-col items-center justify-center gap-1.5 p-2 h-20 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 hover:scale-[1.03] transition-all"
          >
            <Thumb el={el} />
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-full">{el.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
