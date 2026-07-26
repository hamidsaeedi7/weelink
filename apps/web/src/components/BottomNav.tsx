"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BOTTOM_NAV_ITEMS } from "@/app/dashboard/nav-data";

/**
 * Fixed bottom tab bar for mobile — replaces the full-screen drawer as the
 * *primary* way to reach the four most-used destinations (matches the
 * install-app pattern Iranian users already use daily: Instagram, Digikala).
 * The fifth slot ("بیشتر") opens the existing drawer, so nothing is lost —
 * it just stops being the only way in.
 */
export function BottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-chrome
                 border-t border-gray-200/60 dark:border-white/10
                 flex items-stretch justify-around
                 pb-[env(safe-area-inset-bottom)]"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium
                        ${active ? "text-accent-500" : "text-gray-500 dark:text-gray-400"}`}
          >
            <item.icon className={`w-5 h-5 ${active ? "text-accent-500" : ""}`} />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={onOpenMore}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-gray-500 dark:text-gray-400"
      >
        <Menu className="w-5 h-5" />
        بیشتر
      </button>
    </nav>
  );
}
