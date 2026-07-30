"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { BOTTOM_NAV_ITEMS, allNavItems, type NavItem } from "@/app/dashboard/nav-data";

/**
 * Fixed bottom tab bar for mobile — replaces the full-screen drawer as the
 * *primary* way to reach the four most-used destinations (matches the
 * install-app pattern Iranian users already use daily: Instagram, Digikala).
 * The "منو" slot sits in the middle (easiest thumb reach) and normally opens
 * the existing drawer, but on a page outside the four pinned items it
 * surfaces *that page's own* icon/label so the active state still reads as
 * "you are here" instead of a dead label.
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

  const [first, second, third, fourth] = BOTTOM_NAV_ITEMS;

  const MenuButton = (
    <button
      onClick={onOpenMore}
      aria-label="منوی کامل"
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[var(--tap-target)]"
    >
      <Bubble active={Boolean(contextual)}>
        {contextual
          ? <contextual.icon aria-hidden="true" className="w-[18px] h-[18px]" style={{ color: "var(--accent-on-solid)" }} />
          : <LayoutGrid aria-hidden="true" className="w-[18px] h-[18px] text-gray-700 dark:text-gray-300" />}
      </Bubble>
      <span className={`text-[11px] font-medium transition-colors duration-300 ${contextual ? "text-accent font-bold" : "text-gray-700 dark:text-gray-300"}`}>
        {contextual ? contextual.label : "منو"}
      </span>
    </button>
  );

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-chrome rounded-t-[28px]
                 border-t border-gray-200/60 dark:border-white/10
                 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)]
                 flex items-stretch justify-around
                 pb-[env(safe-area-inset-bottom)]"
    >
      <TabButton href={first.href} icon={first.icon} label={first.label} active={isActive(first)} />
      <TabButton href={second.href} icon={second.icon} label={second.label} active={isActive(second)} />
      {MenuButton}
      <TabButton href={third.href} icon={third.icon} label={third.label} active={isActive(third)} />
      <TabButton href={fourth.href} icon={fourth.icon} label={fourth.label} active={isActive(fourth)} />
    </nav>
  );
}

function Bubble({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      // Filled with --accent-solid (not bg-accent-500) so the icon inside can
      // use --accent-on-solid: plain white on the dark-theme green was 1.67:1.
      style={active ? { backgroundColor: "var(--accent-solid)" } : undefined}
      className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ease-out
                  ${active ? "-translate-y-1 shadow-lg shadow-accent-500/30 scale-100" : "scale-90"}`}
    >
      {children}
    </span>
  );
}

function TabButton({ href, icon: Icon, label, active }: { href: string; icon: NavItem["icon"]; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[var(--tap-target)]">
      <Bubble active={active}>
        <Icon aria-hidden="true" className="w-[18px] h-[18px] transition-colors duration-300"
          style={{ color: active ? "var(--accent-on-solid)" : undefined }} />
      </Bubble>
      <span className={`text-[11px] font-medium transition-colors duration-300 ${active ? "text-accent font-bold" : "text-gray-700 dark:text-gray-300"}`}>
        {label}
      </span>
    </Link>
  );
}
