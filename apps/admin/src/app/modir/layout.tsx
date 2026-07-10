"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard, Users, DollarSign, Ticket, Settings,
  FileText, Server, BarChart3, Newspaper, Shield, LogOut,
  Menu, X, Sun, Moon, Bell, Tag, UserCheck, Wrench,
  Globe, Search, Crown,
} from "lucide-react";
import { adminApi } from "@/lib/api";

const NAV_GROUPS = [
  {
    label: "اصلی",
    items: [
      { href: "/modir",              icon: LayoutDashboard, label: "داشبورد",       exact: true },
      { href: "/modir/analytics",    icon: BarChart3,       label: "آمار و تحلیل" },
      { href: "/modir/active-users", icon: UserCheck,       label: "کاربران فعال" },
      { href: "/modir/server-stats", icon: Server,          label: "وضعیت سرور" },
    ],
  },
  {
    label: "مدیریت",
    items: [
      { href: "/modir/users",      icon: Users,      label: "کاربران" },
      { href: "/modir/finance",    icon: DollarSign, label: "مالی" },
      { href: "/modir/tickets",    icon: Ticket,     label: "تیکت‌ها" },
      { href: "/modir/tool-stats", icon: Wrench,     label: "آمار ابزارها" },
    ],
  },
  {
    label: "محتوا",
    items: [
      { href: "/modir/blog",          icon: Newspaper, label: "وبلاگ" },
      { href: "/modir/content",       icon: FileText,  label: "محتوای صفحات" },
      { href: "/modir/discounts",     icon: Tag,       label: "کدهای تخفیف" },
      { href: "/modir/notifications", icon: Bell,      label: "اعلان‌ها" },
      { href: "/modir/landing-pages", icon: Globe,     label: "لندینگ پیج" },
    ],
  },
  {
    label: "سیستم",
    items: [
      { href: "/modir/settings", icon: Settings, label: "تنظیمات" },
      { href: "/modir/admins",   icon: Crown,    label: "مدیران" },
      { href: "/modir/logs",     icon: Shield,   label: "لاگ فعالیت‌ها" },
    ],
  },
];

function NavItem({ item, onClick }: { item: any; onClick?: () => void }) {
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <Link href={item.href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
        ${active
          ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"}`}>
      <item.icon className={`w-4 h-4 shrink-0 ${active ? "text-orange-400" : "group-hover:text-orange-400 transition-colors"}`} />
      {item.label}
    </Link>
  );
}

function ThemeToggleBtn() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => { setMounted(true); }, []);
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
      {mounted ? (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Moon className="w-4 h-4" />}
      {mounted ? (theme === "dark" ? "حالت روشن" : "حالت تاریک") : "حالت تاریک"}
    </button>
  );
}

/** نقش کاربر فعلی از payload توکن (بدون نیاز به secret). */
function currentRole(): string {
  try {
    const token = localStorage.getItem("admin_token");
    if (!token) return "";
    return JSON.parse(atob(token.split(".")[1]))?.role || "";
  } catch {
    return "";
  }
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [role, setRole] = useState("");
  useEffect(() => { setRole(currentRole()); }, []);

  // نویسنده فقط بخش وبلاگ را می‌بیند
  const groups = role === "WRITER"
    ? [{ label: "محتوا", items: [{ href: "/modir/blog", icon: Newspaper, label: "وبلاگ" }] }]
    : NAV_GROUPS;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0D0D18] border-l border-gray-200 dark:border-white/[0.06]">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-white/[0.06]">
        <div className="relative">
          <img src="/weeelink.svg" alt="ویلینک" className="w-9 h-9 rounded-xl" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-orange-500 border-2 border-white dark:border-[#0D0D18] flex items-center justify-center">
            <Shield className="w-2 h-2 text-white" />
          </div>
        </div>
        <div>
          <div className="font-black text-sm text-gray-900 dark:text-white">وی<span className="text-orange-500">لینک</span></div>
          <div className="text-[10px] text-gray-400">پنل مدیریت</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="mr-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => <NavItem key={item.href} item={item} onClick={onClose} />)}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-white/[0.06] space-y-0.5">
        <ThemeToggleBtn />
        <button onClick={() => { localStorage.removeItem("admin_token"); router.push("/modir/login"); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/5 transition-all">
          <LogOut className="w-4 h-4" />
          خروج
        </button>
      </div>
    </div>
  );
}

export default function ModirLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const pathname = usePathname();
  const isLoginPage = pathname === "/modir/login";

  useEffect(() => {
    if (!isLoginPage && !localStorage.getItem("admin_token")) {
      router.replace("/modir/login");
    }
  }, [isLoginPage]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await adminApi.getUsers({ search: q }) as any;
      setSearchResults((res.users || res).slice(0, 5));
    } catch { /**/ }
  };

  // Login page: render bare full-screen (no sidebar/header chrome)
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0A0A0F]" dir="rtl">
      <aside className="hidden lg:flex flex-col w-60 shrink-0">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-64 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 sm:px-6
                           bg-white dark:bg-[#0D0D18] border-b border-gray-200 dark:border-white/[0.06]">
          <button className="lg:hidden p-2 text-gray-500" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div ref={searchRef} className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="جستجوی کاربر..."
              className="w-full pr-9 pl-4 py-2 rounded-xl text-sm
                         bg-gray-100 dark:bg-white/5 border border-transparent
                         focus:border-orange-500/40 focus:outline-none focus:ring-2 focus:ring-orange-500/10
                         text-gray-700 dark:text-gray-300 transition-all" />
            {searchResults.length > 0 && (
              <div className="absolute top-full right-0 mt-1 w-full bg-white dark:bg-[#1A1A2E]
                              border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                {searchResults.map((u: any) => (
                  <Link key={u.id} href={`/modir/users/${u.id}`}
                    onClick={() => { setSearchResults([]); setSearch(""); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                      {(u.email || u.phone || "U")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.email || u.phone}</p>
                      <p className="text-xs text-gray-400">{u.plan}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a href={process.env.NEXT_PUBLIC_WEB_URL || "https://weeelink.ir"} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 mr-auto">
            <Globe className="w-3.5 h-3.5" />
            مشاهده سایت
          </a>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
