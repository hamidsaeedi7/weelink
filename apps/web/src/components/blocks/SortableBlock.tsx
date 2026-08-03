"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { getBlockDef } from "./block-types";

interface Props {
  block: Record<string, any>;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

/** One-line summary of what the block currently holds, for the list row. */
function summarize(block: Record<string, any>, fallback: string): string {
  const d = block.data || {};
  if (block.url) return block.url;
  if (d.content) return d.content;
  if (d.subtitle) return d.subtitle;
  if (d.address) return d.address;
  if (Array.isArray(d.items) && d.items.length) {
    const names = d.items.map((i: any) => i.title || i.name || i.platform).filter(Boolean);
    if (names.length) return names.slice(0, 4).join(" · ");
    return `${d.items.length} مورد`;
  }
  return fallback;
}

export function SortableBlock({ block, onEdit, onDelete, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const def = getBlockDef(block.type);
  const title = block.label || def.label;

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-150
                  ${block.isActive
                    ? "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.07] hover:border-accent-500/40"
                    : "bg-gray-50 dark:bg-white/[0.01] border-gray-100 dark:border-white/[0.04] opacity-60"}`}>
      <button
        {...attributes}
        {...listeners}
        aria-label={`جابه‌جایی ${title}`}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600
                   dark:hover:text-gray-300 transition-colors touch-none">
        <GripVertical aria-hidden="true" className="w-4 h-4" />
      </button>

      <span className="text-lg shrink-0 w-6 text-center" aria-hidden="true">{def.icon}</span>

      {/* The whole row opens the editor — hunting for a 14px pencil was the
          most-repeated action on this page. */}
      <button onClick={onEdit}
        className="flex-1 min-w-0 text-right min-h-[var(--tap-target)] px-1">
        <span className="block text-sm font-medium text-gray-900 dark:text-white truncate">{title}</span>
        <span className="block text-xs text-gray-500 truncate">{summarize(block, def.description)}</span>
      </button>

      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onToggle}
          aria-label={block.isActive ? `مخفی کردن ${title}` : `نمایش ${title}`}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          {block.isActive
            ? <Eye aria-hidden="true" className="w-4 h-4" />
            : <EyeOff aria-hidden="true" className="w-4 h-4" />}
        </button>
        <button onClick={onEdit} aria-label={`ویرایش ${title}`}
          className="p-2 rounded-lg text-gray-400 hover:text-accent-700 hover:bg-accent-500/10 transition-all">
          <Pencil aria-hidden="true" className="w-4 h-4" />
        </button>
        <button onClick={onDelete} aria-label={`حذف ${title}`}
          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
          <Trash2 aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
