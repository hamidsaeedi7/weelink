"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const LINKS = [
  { href: "/", label: "صفحه اصلی" },
  { href: "#features", label: "ویژگی‌ها" },
  { href: "#pricing", label: "تعرفه‌ها" },
  { href: "/training", label: "آموزش" },
  { href: "/blog", label: "وبلاگ" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-4 mt-4">
        <nav className="max-w-7xl mx-auto glass-chrome px-5 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img src="/weeelink.png?v=8" alt="ویلینک"
              className="w-8 h-8 rounded-xl group-hover:scale-105 transition-transform" />
            <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">
              وی<span className="text-accent">لینک</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-2">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="inline-flex items-center min-h-[var(--tap-target)] px-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300
                           hover:text-accent hover:bg-gray-100 dark:hover:bg-white/5 transition-colors whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="tap-target inline-flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300
                         hover:text-accent hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              aria-label="تغییر تم">
              {mounted
                ? (theme === "dark" ? <Sun className="icon-sm" /> : <Moon className="icon-sm" />)
                : <Moon className="icon-sm" />}
            </button>
            <Link href="/login"
              className="tap-target hidden md:inline-flex items-center justify-center text-sm text-gray-700 dark:text-gray-300
                         hover:text-accent transition-colors px-3 rounded-lg
                         hover:bg-gray-100 dark:hover:bg-white/5">
              ورود
            </Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-sm">
              شروع رایگان
            </Link>
            <button
              className="tap-target lg:hidden inline-flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:text-accent transition-colors"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label={open ? "بستن منو" : "منو"}>
              {open ? <X className="icon-md" /> : <Menu className="icon-md" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {open && (
          <div className="mt-2 glass-chrome p-3 space-y-1 lg:hidden">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center min-h-[var(--tap-target)] px-4 py-3 text-base rounded-xl text-gray-700 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-white/5 hover:text-accent transition-all">
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 dark:border-white/5 pt-2 mt-2">
              <Link href="/login" onClick={() => setOpen(false)}
                className="flex items-center min-h-[var(--tap-target)] px-4 py-3 text-base rounded-xl text-gray-700 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-white/5 hover:text-accent transition-all">
                ورود به حساب
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}
                className="mt-1 block btn-primary text-center text-sm py-3">
                شروع رایگان
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
