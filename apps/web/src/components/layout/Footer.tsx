import Link from "next/link";

const LINKS = {
  محصول: [
    { href: "/", label: "صفحه اصلی" },
    { href: "#features", label: "ویژگی‌ها" },
    { href: "#pricing", label: "تعرفه‌ها" },
    { href: "/blog", label: "وبلاگ" },
  ],
  شرکت: [
    { href: "/about", label: "درباره ما" },
    { href: "/contact", label: "تماس با ما" },
    { href: "/terms", label: "قوانین استفاده" },
    { href: "/privacy", label: "حریم خصوصی" },
    { href: "/modir/login", label: "پنل مدیریت" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Col 1 — Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/weeelink.svg" alt="ویلینک" className="w-8 h-8 rounded-xl" />
              <span className="font-black text-gray-900 dark:text-white text-lg">
                وی<span className="text-blue-600">لینک</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed max-w-xs">
              پلتفرم لینک بیو فارسی برای فروشگاه‌های اینستاگرامی و کسب‌وکارهای ایرانی.
              بدون کارمزد، با پشتیبانی پیام‌رسان‌های ایرانی.
            </p>
          </div>

          {/* Col 2 — محصول */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">محصول</h4>
            <ul className="space-y-2.5">
              {LINKS["محصول"].map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-500 dark:text-gray-500
                               hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — شرکت */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">شرکت</h4>
            <ul className="space-y-2.5">
              {LINKS["شرکت"].map((l) => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-sm text-gray-500 dark:text-gray-500
                               hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — اعتماد و امنیت */}
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">اعتماد و امنیت</h4>
            <div className="flex flex-col gap-3">
              {/* اینماد */}
              <a href="https://trustseal.enamad.ir" target="_blank" rel="noopener noreferrer"
                 title="نماد اعتماد الکترونیکی">
                <div className="w-14 h-14 rounded-xl border border-dashed border-gray-300 dark:border-gray-700
                                flex flex-col items-center justify-center gap-0.5
                                hover:border-blue-600/40 transition-colors cursor-pointer">
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">اینماد</span>
                  <div className="w-7 h-7 rounded-md bg-green-600/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-green-600" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                  </div>
                </div>
              </a>

              {/* زرین‌پال */}
              <a href="https://zarinpal.com" target="_blank" rel="noopener noreferrer"
                 title="درگاه پرداخت زرین‌پال">
                <div className="h-14 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700
                                flex flex-col items-center justify-center gap-0.5
                                hover:border-blue-600/40 transition-colors cursor-pointer">
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">پرداخت امن</span>
                  <div className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded-md bg-[#5D9B3F]/10 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#5D9B3F]" fill="currentColor">
                        <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-[#5D9B3F]">زرین‌پال</span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/[0.04]
                        flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} ویلینک — تمامی حقوق محفوظ است
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            ساخته شده توسط{" "}
            <a href="https://saeedii.com" target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-500 transition-colors font-medium">
              HamiD Saeedi
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
