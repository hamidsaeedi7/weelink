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

export function SortableBlock({ block, onEdit, onDelete, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const def = getBlockDef(block.type);

  return (
    <div ref={setNodeRef} style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150
                  ${block.isActive
                    ? "bg-white/[0.03] border-white/[0.07] hover:border-white/15"
                    : "bg-white/[0.01] border-white/[0.04] opacity-50"}`}>
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-600 hover:text-gray-400 transition-colors touch-none">
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon */}
      <span className="text-lg shrink-0 w-7 text-center">{def.icon}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {block.label || def.label}
        </div>
        <div className="text-xs text-gray-600 truncate">
          {block.url || block.data?.content || def.description}
        </div>
      </div>

      {/* Type badge */}
      <span className={`text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${def.color}`}>
        {def.label}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
          title={block.isActive ? "مخفی کردن" : "نمایش"}>
          {block.isActive
            ? <Eye className="w-3.5 h-3.5" />
            : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onEdit}
          className="p-1.5 rounded-lg text-gray-600 hover:text-orange-400 hover:bg-orange-500/5 transition-all">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete}
          className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
