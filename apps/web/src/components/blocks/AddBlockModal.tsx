"use client";

import { useState } from "react";
import { X, Search } from "lucide-react";
import {
  BLOCK_TYPES, BLOCK_CATEGORIES, BLOCK_CATEGORY_OF,
  type BlockType, type BlockCategory,
} from "./block-types";

interface Props {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export function AddBlockModal({ onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<BlockCategory>("site");

  // Search cuts across every category — once you're typing a name, being made
  // to also pick the right tab is pure friction.
  const filtered = search
    ? BLOCK_TYPES.filter((b) => b.label.includes(search) || b.description.includes(search))
    : BLOCK_TYPES.filter((b) => BLOCK_CATEGORY_OF[b.type] === tab);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div role="dialog" aria-modal="true" aria-label="افزودن بلوک"
        className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#111122]
                   border border-gray-200 dark:border-white/[0.08]
                   rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-fade-up
                   pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.06]">
          <h3 className="font-bold text-gray-900 dark:text-white">افزودن بلوک</h3>
          <button onClick={onClose} aria-label="بستن"
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white
                       hover:bg-black/5 dark:hover:bg-white/5 transition-all">
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-200 dark:border-white/[0.04] space-y-2.5">
          <div className="relative">
            <Search aria-hidden="true" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی بلوک..."
              aria-label="جستجوی بلوک"
              className="input-base !py-2.5 pr-9 text-sm"
            />
          </div>

          {!search && (
            <div role="tablist" aria-label="دسته‌بندی بلوک‌ها" className="flex gap-1 overflow-x-auto scrollbar-hide">
              {BLOCK_CATEGORIES.map((c) => (
                <button key={c.id} role="tab" aria-selected={tab === c.id} onClick={() => setTab(c.id)}
                  className={`shrink-0 px-3 min-h-[2.25rem] rounded-lg text-xs font-bold transition-all
                              ${tab === c.id
                                ? "bg-accent-500 text-[color:var(--accent-on-solid)]"
                                : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 space-y-1 max-h-[50vh] sm:max-h-[360px] overflow-y-auto scrollbar-hide">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">بلوکی با این نام پیدا نشد</p>
          )}
          {filtered.map((block) => (
            <button
              key={block.type}
              onClick={() => { onSelect(block.type); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl
                         hover:bg-black/5 dark:hover:bg-white/5 transition-all group text-right">
              <span className="text-xl w-8 text-center" aria-hidden="true">{block.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-accent-700 transition-colors">
                  {block.label}
                </div>
                <div className="text-xs text-gray-500 truncate">{block.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
