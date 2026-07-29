"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

/** Kept in sync by hand with the keydown handler in the studio page. */
const SHORTCUTS: { keys: string[]; label: string; group: string }[] = [
  { keys: ["Ctrl", "Z"], label: "واگرد", group: "ویرایش" },
  { keys: ["Ctrl", "Shift", "Z"], label: "ازنو", group: "ویرایش" },
  { keys: ["Ctrl", "D"], label: "تکثیر عنصر انتخاب‌شده", group: "ویرایش" },
  { keys: ["Delete"], label: "حذف عنصر انتخاب‌شده", group: "ویرایش" },
  { keys: ["Ctrl", "S"], label: "ذخیرهٔ فوری", group: "ویرایش" },
  { keys: ["↑", "↓", "←", "→"], label: "جابه‌جایی ۲ پیکسلی", group: "جابه‌جایی" },
  { keys: ["Shift", "+", "جهت"], label: "جابه‌جایی ۲۰ پیکسلی", group: "جابه‌جایی" },
  { keys: ["Esc"], label: "توقف پیش‌نمایش", group: "نمایش" },
  { keys: ["?"], label: "همین پنل میان‌برها", group: "نمایش" },
];

export function ShortcutsPanel() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim();
    const list = q ? SHORTCUTS.filter((s) => s.label.includes(q) || s.keys.join(" ").toLowerCase().includes(q.toLowerCase())) : SHORTCUTS;
    return list.reduce<Record<string, typeof SHORTCUTS>>((acc, s) => {
      (acc[s.group] ??= []).push(s);
      return acc;
    }, {});
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جست‌وجوی میان‌بر..."
          className="input-base w-full !py-2 !pr-9 text-xs"
          autoFocus
        />
      </div>

      {Object.keys(groups).length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">میان‌بری پیدا نشد.</p>
      ) : (
        Object.entries(groups).map(([group, items]) => (
          <div key={group} className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{group}</h3>
            {items.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]">
                <span className="text-xs text-gray-700 dark:text-gray-300">{s.label}</span>
                <span className="flex items-center gap-1 shrink-0" dir="ltr">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-[10px] font-bold text-gray-600 dark:text-gray-300"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
        روی مک، به‌جای Ctrl از ⌘ استفاده کن.
      </p>
    </div>
  );
}
