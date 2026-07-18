import Link from "next/link";
import { Phone, MapPin } from "lucide-react";

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          {/* Col 1 — Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/weeelink.png" alt="ویلینک" className="w-8 h-8 rounded-xl" />
              <span className="font-black text-gray-900 dark:text-white text-lg">
                وی<span className="text-blue-600">لینک</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed max-w-xs">
              پلتفرم لینک بیو فارسی برای فروشگاه‌های اینستاگرامی و کسب‌وکارهای ایرانی.
              بدون کارمزد، با پشتیبانی پیام‌رسان‌های ایرانی.
            </p>
            <div className="space-y-2.5 pt-1">
              <a href="tel:+989107192646"
                className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-500
                           hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit">
                <Phone className="w-4 h-4 shrink-0 text-gray-400 dark:text-gray-600" />
                <span dir="ltr">۰۹۱۰۷۱۹۲۶۴۶</span>
              </a>
              <a href="https://maps.google.com/?q=تهران، پیروزی، خیابان اول نیروی هوایی، کوچه کاظمی، پلاک ۱۱"
                target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-500
                           hover:text-blue-600 dark:hover:text-blue-400 transition-colors max-w-xs">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-gray-400 dark:text-gray-600" />
                <span className="leading-relaxed">تهران، پیروزی، خیابان اول نیروی هوایی، کوچه کاظمی، پلاک ۱۱</span>
              </a>
            </div>
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
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-4">اعتماد و امنیت</h4>
            <div className="flex flex-row items-center sm:flex-col sm:items-start gap-3">
              {/* اینماد */}
              {/* eslint-disable-next-line react/no-unknown-property */}
              <a referrerPolicy="origin" target="_blank"
                 href="https://trustseal.enamad.ir/?id=6747774&Code=iFwZfjM8DpuFZMQlmNPlAXgPVngXQO41">
                {/* eslint-disable-next-line react/no-unknown-property */}
                <img referrerPolicy="origin"
                     src="https://trustseal.enamad.ir/logo.aspx?id=6747774&Code=iFwZfjM8DpuFZMQlmNPlAXgPVngXQO41"
                     alt=""
                     style={{ cursor: "pointer" }}
                     // @ts-ignore
                     code="iFwZfjM8DpuFZMQlmNPlAXgPVngXQO41"
                />
              </a>

              {/* زیبال */}
              <a href="https://zibal.ir" target="_blank" rel="noopener noreferrer"
                 title="درگاه پرداخت زیبال" className="transition-transform hover:scale-105">
                <img src="/icons/zibal.png" alt="زیبال" style={{ cursor: "pointer", width: 52, height: 52, borderRadius: 12 }} />
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
