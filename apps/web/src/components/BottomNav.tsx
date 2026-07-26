"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { BOTTOM_NAV_ITEMS, allNavItems, type NavItem } from "@/app/dashboard/nav-data";

/**
 * Fixed bottom tab bar for mobile — replaces the full-screen drawer as the
 * *primary* way to reach the four most-used destinations (matches the
 * install-app pattern Iranian users already use daily: Instagram, Digikala).
 * The fifth slot normally opens the existing drawer ("بیشتر"), but on a page
 * outside the four pinned items it surfaces *that page's own* icon/label so
 * the active state still reads as "you are here" instead of a dead label.
 */
export function BottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
  const pinnedMatch = BOTTOM_NAV_ITEMS.some(isActive);

  const contextual = !pinnedMatch
    ? allNavItems()
        .filter((item) => item.href !== "/dashboard")
        .filter((item) => pathname.startsWith(item.href))
        .sort((a, b) => b.href.length - a.href.length)[0]
    : null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-chrome rounded-t-[28px]
                 border-t border-gray-200/60 dark:border-white/10
                 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)]
                 flex items-stretch justify-around
                 pb-[env(safe-area-inset-bottom)]"
    >
      {BOTTOM_NAV_ITEMS.map((item) => (
        <TabButton key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item)} />
      ))}

      <button
        onClick={onOpenMore}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
      >
        <Bubble active={Boolean(contextual)}>
          {contextual ? <contextual.icon className={`w-[18px] h-[18px] ${contextual ? "text-white" : ""}`} /> : <Menu className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />}
        </Bubble>
        <span className={`text-[10px] font-medium transition-colors duration-300 ${contextual ? "text-accent-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
          {contextual ? contextual.label : "بیشتر"}
        </span>
      </button>
    </nav>
  );
}

function Bubble({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full transition-all duration-300 ease-out
                  ${active
                    ? "w-9 h-9 bg-accent-500 -translate-y-1 shadow-lg shadow-accent-500/30 scale-100"
                    : "w-9 h-9 scale-90"}`}
    >
      {children}
    </span>
  );
}

function TabButton({ href, icon: Icon, label, active }: { href: string; icon: NavItem["icon"]; label: string; active: boolean }) {
  return (
    <Link href={href} className="flex-1 flex flex-col items-center justify-center gap-1 py-2">
      <Bubble active={active}>
        <Icon className={`w-[18px] h-[18px] transition-colors duration-300 ${active ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
      </Bubble>
      <span className={`text-[10px] font-medium transition-colors duration-300 ${active ? "text-accent-500 font-bold" : "text-gray-500 dark:text-gray-400"}`}>
        {label}
      </span>
    </Link>
  );
}
