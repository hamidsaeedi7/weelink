"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { allNavItems, type NavItem } from "@/app/dashboard/nav-data";

/** Simple substring/fuzzy-ish match: every character of the query must
 *  appear in order somewhere in the label — good enough for a ~30-item
 *  index without pulling in a fuzzy-search dependency. */
function matches(label: string, query: string): boolean {
  if (!query) return true;
  const q = query.trim();
  if (label.includes(q)) return true;
  let qi = 0;
  for (const ch of label) {
    if (ch === q[qi]) qi++;
    if (qi === q.length) return true;
  }
  return false;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => allNavItems(), []);
  const results = useMemo(
    () => items.filter((i) => matches(i.label, query)).slice(0, 8),
    [items, query],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const go = (item: NavItem) => {
    setOpen(false);
    router.push(item.href);
  };

  const onKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[activeIndex]) { e.preventDefault(); go(results[activeIndex]); }
  };

  return (
    <>
      {/* Trigger — desktop hint + mobile floating button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400
                   glass-chrome hover:border-accent-500/30 transition-colors"
        aria-label="جست‌وجوی سریع"
      >
        <Search className="w-3.5 h-3.5" />
        <span>جست‌وجو…</span>
        <span className="mr-1 px-1.5 py-0.5 rounded border border-gray-300 dark:border-white/10 text-[10px] font-mono" dir="ltr">
          Ctrl K
        </span>
      </button>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full btn-primary shadow-lg flex items-center justify-center"
        aria-label="جست‌وجوی سریع"
      >
        <Search className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg glass-chrome rounded-2xl overflow-hidden shadow-2xl backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200/60 dark:border-white/10">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyNav}
                placeholder="به کجا می‌خوای بری؟"
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-gray-400">چیزی پیدا نشد</li>
              ) : (
                results.map((item, i) => (
                  <li key={item.href}>
                    <button
                      onClick={() => go(item)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                                  ${i === activeIndex
                                    ? "bg-accent-500/15 text-accent-600 dark:text-accent-400"
                                    : "text-gray-700 dark:text-gray-300"}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-right">{item.label}</span>
                      {item.pro && (
                        <span className="text-[9px] bg-accent-500/20 text-accent-500 px-1.5 py-0.5 rounded-md">Pro</span>
                      )}
                      {i === activeIndex && <CornerDownLeft className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
