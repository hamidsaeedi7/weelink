"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import { BLOCK_TYPES, type BlockType, type BlockDef } from "./block-types";

interface Props {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function AddBlockModal({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");

  const filtered = BLOCK_TYPES.filter(
    (b) =>
      b.label.includes(search) ||
      b.description.includes(search),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-[#111122] border border-white/[0.08]
                      rounded-2xl overflow-hidden shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="font-bold text-white">افزودن بلوک</h3>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full pr-9 pl-4 py-2 rounded-xl bg-white/5 border border-white/8
                         text-white text-sm placeholder:text-gray-600 focus:outline-none
                         focus:border-orange-500/40 transition-all"
            />
          </div>
        </div>

        {/* Block List */}
        <div className="p-3 space-y-1 max-h-[360px] overflow-y-auto scrollbar-hide">
          {filtered.map((block) => (
            <button
              key={block.type}
              onClick={() => { onSelect(block.type); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                         hover:bg-white/5 transition-all group text-right">
              <span className="text-xl w-8 text-center">{block.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors">
                  {block.label}
                </div>
                <div className="text-xs text-gray-600 truncate">{block.description}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md border ${block.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                افزودن
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
