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
        <nav className="max-w-7xl mx-auto glass-card px-5 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img src="/weeelink.svg" alt="ویلینک"
              className="w-8 h-8 rounded-xl group-hover:scale-105 transition-transform" />
            <span className="font-black text-gray-900 dark:text-white text-lg tracking-tight">
              وی<span className="text-accent">لینک</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-5">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-sm text-gray-600 dark:text-gray-400
                           hover:text-accent transition-colors whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-gray-500 hover:text-accent
                         hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              aria-label="تغییر تم">
              {mounted
                ? (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)
                : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/login"
              className="hidden md:inline-flex text-sm text-gray-600 dark:text-gray-400
                         hover:text-accent transition-colors px-3 py-1.5 rounded-lg
                         hover:bg-gray-100 dark:hover:bg-white/5">
              ورود
            </Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-sm">
              شروع رایگان
            </Link>
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-accent transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="منو">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {open && (
          <div className="mt-2 glass-card p-3 space-y-1 lg:hidden">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm rounded-xl text-gray-700 dark:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-white/5 hover:text-accent transition-all">
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 dark:border-white/5 pt-2 mt-2">
              <Link href="/login" onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm rounded-xl text-gray-700 dark:text-gray-300
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
