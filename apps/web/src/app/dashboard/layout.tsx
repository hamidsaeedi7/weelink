"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Link2, ShoppingBag, Package, BarChart3,
  Ticket, Settings, LogOut, Menu, X, Sun, Moon, Tag, QrCode, Zap,
  Code2, FlaskConical, CalendarDays, FileDown, BookOpen,
  CalendarCheck, Scissors, Users, Handshake, Bot, LayoutTemplate,
  ChevronDown, Store, Flame, Globe,
} from "lucide-react";
import { ProUpgradeModal } from "@/components/ProUpgradeModal";

const NAV_GROUPS = [
  {
    label: "اصلی",
    items: [
      { href: "/dashboard",           icon: LayoutDashboard, label: "خانه",           exact: true },
      { href: "/dashboard/blocks",    icon: Link2,            label: "لینک‌ها" },
      { href: "/dashboard/analytics", icon: BarChart3,        label: "آمار",           pro: true },
      { href: "/dashboard/qrcode",    icon: QrCode,           label: "QR Code" },
    ],
  },
  {
    label: "فروش",
    items: [
      { href: "/dashboard/digital-files", icon: FileDown,      label: "فایل دیجیتال" },
      { href: "/dashboard/courses",       icon: BookOpen,      label: "دوره‌های آموزشی", pro: true },
      { href: "/dashboard/products",      icon: ShoppingBag,   label: "محصولات فیزیکی" },
      { href: "/dashboard/orders",        icon: Package,       label: "سفارش‌ها" },
      { href: "/dashboard/appointments",  icon: CalendarCheck, label: "رزرو وقت" },
      { href: "/dashboard/flash-sale",    icon: Flame,         label: "فلش سیل",          pro: true },
      { href: "/dashboard/coupons",       icon: Tag,           label: "تخفیف‌ها" },
    ],
  },
  {
    label: "بازاریابی",
    items: [
      { href: "/dashboard/affiliate",        icon: Handshake,     label: "همکاری در فروش" },
      { href: "/dashboard/short-links",      icon: Scissors,      label: "لینک کوتاه",    pro: true },
      { href: "/dashboard/audience",         icon: Users,         label: "مخاطبان",       pro: true },
      { href: "/dashboard/auto-reply",       icon: Bot,           label: "پاسخ خودکار",  pro: true },
      { href: "/dashboard/content-calendar", icon: CalendarDays,  label: "تقویم محتوا",   pro: true },
    ],
  },
  {
    label: "ابزارها",
    items: [
      { href: "/dashboard/templates",  icon: LayoutTemplate, label: "قالب‌ها" },
      { href: "/dashboard/ab-testing", icon: FlaskConical,   label: "تست A/B", pro: true },
      { href: "/dashboard/embed",      icon: Code2,          label: "کد جاسازی" },
    ],
  },
  {
    label: "حساب",
    items: [
      { href: "/dashboard/shop",    icon: Store,    label: "تنظیمات صفحه" },
      { href: "/dashboard/domains", icon: Globe,    label: "دامنه اختصاصی",  pro: true },
      { href: "/dashboard/plans",   icon: Zap,      label: "ارتقا پلن" },
      { href: "/dashboard/tickets", icon: Ticket,   label: "پشتیبانی" },
      { href: "/dashboard/account", icon: Settings, label: "حساب کاربری" },
    ],
  },
];

interface SidebarContentProps {
  pathname: string;
  collapsed: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavClick: () => void;
  mounted: boolean;
  theme: string | undefined;
  onToggleTheme: () => void;
  mobile?: boolean;
}

function SidebarContent({
  pathname, collapsed, onToggleGroup, onNavClick, mounted, theme, onToggleTheme, mobile = false,
}: SidebarContentProps) {
  return (
    <div className={`flex flex-col h-full ${mobile ? "p-3" : "p-3 py-5"}`}>
      <Link href="/" className="flex items-center gap-2.5 mb-6 px-2">
        <img src="/weeelink.png" alt="ویلینک" className="w-8 h-8 rounded-xl" />
        <span className="font-black text-gray-900 dark:text-white">
          وی<span className="text-accent">لینک</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto space-y-4 scrollbar-none">
        {NAV_GROUPS.map((group) => {
          const isCollapsed = collapsed[group.label];
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
                  {group.items.map((item) => {
                    const active = (item as any).exact
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href}
                        onClick={onNavClick}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150
                                    ${active
                                      ? "bg-orange-500/15 text-orange-500 border border-orange-500/20"
                                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"}`}>
                        <item.icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-orange-500" : ""}`} />
                        <span className="truncate">{item.label}</span>
                        {(item as any).pro && (
                          <span className="mr-auto text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-md shrink-0">Pro</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-1 pt-3 border-t border-gray-200 dark:border-white/[0.06]">
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const toggleGroup = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const sidebarProps = { pathname, collapsed, onToggleGroup: toggleGroup, onNavClick: () => setOpen(false), mounted, theme, onToggleTheme: toggleTheme };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0A0A0F] overflow-hidden" dir="rtl">
      <aside className="hidden md:flex flex-col w-52 border-l border-gray-200 dark:border-white/[0.06]
                        bg-white dark:bg-[#0D0D18] shrink-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-60 bg-white dark:bg-[#0D0D18]
                            border-l border-gray-200 dark:border-white/[0.06]">
            <SidebarContent {...sidebarProps} mobile />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 sm:px-6
                           border-b border-gray-200 dark:border-white/[0.06]
                           bg-white dark:bg-[#0D0D18] shrink-0">
          <button className="md:hidden p-2 text-gray-500" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mr-auto">
            <Link href="/" target="_blank"
              className="text-xs text-gray-500 hover:text-orange-500 transition-colors">
              مشاهده صفحه بیو ↗
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <ProUpgradeModal />
    </div>
  );
}
