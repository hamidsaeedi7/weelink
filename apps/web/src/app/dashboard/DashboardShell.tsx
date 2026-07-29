"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  LogOut, Menu, X, Sun, Moon, ChevronDown, Bell, Smartphone,
} from "lucide-react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";
import { CommandPalette } from "@/components/CommandPalette";
import { BottomNav } from "@/components/BottomNav";
import { shopsApi, notificationsApi } from "@/lib/api";
import { HOME_ITEM, NAV_GROUPS, ACCOUNT_ITEMS, isGraduated, type NavItem } from "./nav-data";

const GRADUATION_SEEN_KEY = "weelink_graduated_at";
const NEW_BADGE_DAYS = 7;

interface SidebarContentProps {
  pathname: string;
  collapsed: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavClick: () => void;
  mounted: boolean;
  theme: string | undefined;
  onToggleTheme: () => void;
  showAdvanced: boolean;
  showNewBadge: boolean;
  mobile?: boolean;
}

function NavLink({ item, active, onClick, isNew }: { item: NavItem; active: boolean; onClick: () => void; isNew: boolean }) {
  if (item.comingSoon) {
    return (
      <div
        aria-disabled="true"
        title="این بخش هنوز آماده نیست"
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60"
      >
        <item.icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{item.label}</span>
        <span className="mr-auto text-[9px] bg-gray-400/15 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md shrink-0">به‌زودی</span>
      </div>
    );
  }
  return (
    <Link href={item.href} onClick={onClick}
      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150
                  ${active
                    ? "bg-accent-500/15 text-accent-500 border border-accent-500/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"}`}>
      <item.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-accent-500" : ""}`} />
      <span className="truncate">{item.label}</span>
      {isNew && (
        <span className="mr-auto text-[9px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-md shrink-0">جدید</span>
      )}
      {!isNew && item.pro && (
        <span className="mr-auto text-[9px] bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-md shrink-0">Pro</span>
      )}
    </Link>
  );
}

function SidebarContent({
  pathname, collapsed, onToggleGroup, onNavClick, mounted, theme, onToggleTheme, showAdvanced, showNewBadge, mobile = false,
}: SidebarContentProps) {
  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className={`flex flex-col h-full ${mobile ? "p-3" : "p-3 py-5"}`}>
      <Link href="/" className="flex items-center gap-2.5 mb-4 px-2">
        <img src="/weeelink.png?v=8" alt="ویلینک" className="w-8 h-8 rounded-xl" />
        <span className="font-black text-gray-900 dark:text-white">
          وی<span className="text-accent">لینک</span>
        </span>
      </Link>

      <div className="mb-3">
        <NavLink item={HOME_ITEM} active={isActive(HOME_ITEM)} onClick={onNavClick} isNew={false} />
      </div>

      <nav className="flex-1 overflow-y-auto space-y-4 scrollbar-none">
        {NAV_GROUPS.map((group) => {
          const isCollapsed = collapsed[group.label];
          const items = group.items.filter((item) => showAdvanced || !item.advanced);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <button
                onClick={() => onToggleGroup(group.label)}
                className="flex items-center justify-between w-full px-2 mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {group.label}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <NavLink key={item.href} item={item} active={isActive(item)} onClick={onNavClick}
                      isNew={Boolean(item.advanced) && showNewBadge} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-0.5 pt-3 mt-3 border-t border-gray-200 dark:border-white/[0.06]">
        {ACCOUNT_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item)} onClick={onNavClick} isNew={false} />
        ))}
      </div>

      <div className="space-y-1 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
        {/* On mobile the theme toggle lives in the top header next to the bell instead */}
        {!mobile && (
          <button
            onClick={onToggleTheme}
            suppressHydrationWarning
            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs
                       text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            {mounted ? (theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />) : <Moon className="w-3.5 h-3.5" />}
            <span suppressHydrationWarning>
              {mounted ? (theme === "dark" ? "حالت روشن" : "حالت تاریک") : "حالت تاریک"}
            </span>
          </button>
        )}
        <button
          onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-xs
                     text-red-500 hover:bg-red-500/5 transition-all">
          <LogOut className="w-3.5 h-3.5" />
          خروج
        </button>
      </div>
    </div>
  );
}

function AnimatedThemeToggle({ mounted, theme, onToggle }: { mounted: boolean; theme: string | undefined; onToggle: () => void }) {
  const isDark = mounted && theme === "dark";
  return (
    <button
      onClick={onToggle}
      suppressHydrationWarning
      aria-label="تغییر تم"
      className="relative w-8 h-8 rounded-full flex items-center justify-center glass-chrome
                 text-gray-500 dark:text-gray-400 overflow-hidden shrink-0">
      <Sun className={`w-4 h-4 absolute transition-all duration-500 ease-out
                       ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`} />
      <Moon className={`w-4 h-4 absolute transition-all duration-500 ease-out
                        ${isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
    </button>
  );
}

function NotificationBell() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [seenGlobal, setSeenGlobal] = useState<string[]>([]);

  useEffect(() => {
    try { setSeenGlobal(JSON.parse(localStorage.getItem("weelink_seen_notifications") || "[]")); } catch { /* ignore */ }
    notificationsApi.mine().then((d: any) => setItems(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const isUnread = (n: any) => (n.userId ? !n.isRead : !seenGlobal.includes(n.id));
  const unreadCount = items.filter(isUnread).length;

  const markRead = async (n: any) => {
    if (!isUnread(n)) return;
    if (n.userId) {
      await notificationsApi.markRead(n.id).catch(() => {});
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    } else {
      const next = [...seenGlobal, n.id];
      setSeenGlobal(next);
      localStorage.setItem("weelink_seen_notifications", JSON.stringify(next));
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="relative w-8 h-8 rounded-full flex items-center justify-center glass-chrome text-gray-500 dark:text-gray-400">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 glass-chrome backdrop-blur-2xl rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200/60 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white">
              اعلان‌ها
            </div>
            <div className="max-h-72 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-gray-400">اعلانی نداری</p>
              ) : (
                items.map((n) => (
                  <button key={n.id} onClick={() => markRead(n)}
                    className={`w-full text-right px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0
                                ${isUnread(n) ? "bg-accent-500/[0.04]" : ""}`}>
                    <div className="flex items-start gap-2">
                      {isUnread(n) && <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [slug, setSlug] = useState("");
  const [shop, setShop] = useState<any>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    shopsApi.getMine().then((s: any) => {
      const data = s?.data ?? s;
      setShop(data);
      setSlug(data?.slug || "");
    }).catch(() => {});
  }, []);

  const graduated = useMemo(() => isGraduated(shop), [shop]);

  // Once graduated, remember *when* so the "جدید" badge on newly-revealed
  // items fades after a week instead of staying forever.
  const showNewBadge = useMemo(() => {
    if (!graduated) return false;
    let seenAt = localStorage.getItem(GRADUATION_SEEN_KEY);
    if (!seenAt) {
      seenAt = String(Date.now());
      localStorage.setItem(GRADUATION_SEEN_KEY, seenAt);
    }
    return Date.now() - Number(seenAt) < NEW_BADGE_DAYS * 86400000;
  }, [graduated]);

  const toggleGroup = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const sidebarProps = {
    pathname, collapsed, onToggleGroup: toggleGroup, onNavClick: () => setOpen(false),
    mounted, theme, onToggleTheme: toggleTheme, showAdvanced: graduated, showNewBadge,
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0A0A0F] overflow-hidden" dir="rtl">
      <aside className="hidden md:flex flex-col w-52 border-l border-gray-200 dark:border-white/[0.06]
                        glass-chrome shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ease-out
                    ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside
          className={`absolute right-0 top-0 h-full w-60 glass-chrome backdrop-blur-2xl
                      border-l border-gray-200 dark:border-white/[0.06]
                      transition-transform duration-300 ease-out
                      ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <button onClick={() => setOpen(false)} className="absolute left-3 top-4 p-1.5 text-gray-400">
            <X className="w-4 h-4" />
          </button>
          <SidebarContent {...sidebarProps} mobile />
        </aside>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 sm:px-6
                           border-b border-gray-200 dark:border-white/[0.06]
                           glass-chrome shrink-0">
          <button className="md:hidden p-2 text-gray-500" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-3 mr-auto">
            <CommandPalette />
            <Link href={slug ? `/${slug}` : "/dashboard/shop"} target="_blank"
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center glass-chrome
                         text-gray-500 dark:text-gray-400 shrink-0" aria-label="مشاهده صفحه بیو">
              <Smartphone className="w-4 h-4" />
            </Link>
            <div className="md:hidden">
              <AnimatedThemeToggle mounted={mounted} theme={theme} onToggle={toggleTheme} />
            </div>
            <NotificationBell />
            <Link href={slug ? `/${slug}` : "/dashboard/shop"} target="_blank"
              className="hidden md:inline text-xs text-gray-500 hover:text-accent-500 transition-colors">
              مشاهده صفحه بیو ↗
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav onOpenMore={() => setOpen(true)} />
      <ProUpgradeModal />
    </div>
  );
}
