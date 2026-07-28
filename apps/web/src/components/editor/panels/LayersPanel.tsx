"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff, Image as ImageIcon, Layers, Lock, Shapes, Trash2, Type, Unlock } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import type { EditorObject } from "@/lib/editor/types";
import { EmptyHint } from "../ui";

const ICON = { text: Type, image: ImageIcon, shape: Shapes } as const;

function layerLabel(o: EditorObject) {
  if (o.type === "text") return o.text.trim().slice(0, 24) || o.name;
  return o.name;
}

export function LayersPanel() {
  const doc = useEditor((s) => s.doc);
  const activePageId = useEditor((s) => s.activePageId);
  const selectedIds = useEditor((s) => s.selectedIds);
  const select = useEditor((s) => s.select);
  const patchObject = useEditor((s) => s.patchObject);
  const beginTransaction = useEditor((s) => s.beginTransaction);
  const removeObjects = useEditor((s) => s.removeObjects);
  const moveLayer = useEditor((s) => s.moveLayer);

  const page = doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0];

  if (!page.objects.length) {
    return <EmptyHint icon={Layers}>هنوز عنصری اضافه نکرده‌ای. از نوار ابزار متن، تصویر یا شکل اضافه کن.</EmptyHint>;
  }

  // Painted last = visually on top, so the panel lists them top-first.
  const items = [...page.objects].reverse();

  return (
    <ul className="space-y-1">
      {items.map((o, visualIndex) => {
        const realIndex = page.objects.length - 1 - visualIndex;
        const Icon = ICON[o.type];
        const active = selectedIds.includes(o.id);
        return (
          <li
            key={o.id}
            onClick={() => select([o.id])}
            className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
              active ? "bg-accent-500/10" : "hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${active ? "text-accent-500" : "text-gray-400"}`} />
            <span className={`flex-1 text-xs truncate ${active ? "font-bold text-accent-600 dark:text-accent-400" : "text-gray-600 dark:text-gray-300"}`}>
              {layerLabel(o)}
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); moveLayer(realIndex, Math.min(page.objects.length - 1, realIndex + 1)); }}
              disabled={realIndex === page.objects.length - 1}
              aria-label="یک لایه بالاتر"
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveLayer(realIndex, Math.max(0, realIndex - 1)); }}
              disabled={realIndex === 0}
              aria-label="یک لایه پایین‌تر"
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-25"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); beginTransaction(); patchObject(o.id, { visible: !o.visible }); }}
              aria-label={o.visible ? "مخفی کردن لایه" : "نمایش لایه"}
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {o.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); beginTransaction(); patchObject(o.id, { locked: !o.locked }); }}
              aria-label={o.locked ? "باز کردن قفل لایه" : "قفل کردن لایه"}
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {o.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeObjects([o.id]); }}
              aria-label="حذف لایه"
              className="p-1 rounded text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
