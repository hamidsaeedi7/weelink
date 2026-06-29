"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "آیا ویلینک واقعاً رایگان است؟",
    a: "بله، پلن رایگان ویلینک برای همیشه رایگان است و هیچ کارمزدی از فروش‌های شما کسر نمی‌شود. امکانات پایه شامل صفحه بیو، فروشگاه و درگاه پرداخت ایرانی است.",
  },
  {
    q: "آیا به دانش فنی یا کدنویسی نیاز دارم؟",
    a: "خیر. ویلینک به گونه‌ای طراحی شده که هر کسی بدون هیچ دانش فنی بتواند در چند دقیقه صفحه بیو و فروشگاه خود را راه‌اندازی کند.",
  },
  {
    q: "چه پیام‌رسان‌هایی پشتیبانی می‌شوند؟",
    a: "ویلینک از سه پیام‌رسان ایرانی بله، ایتا و روبیکا به طور کامل پشتیبانی می‌کند. می‌توانید دکمه ارتباط مستقیم برای هر کدام اضافه کنید.",
  },
  {
    q: "مشتریانم چطور پرداخت می‌کنند؟",
    a: "از طریق درگاه پرداخت زرین‌پال که مستقیماً به حساب بانکی شما متصل است. پول فروش مستقیم به حساب شما واریز می‌شود و ما هیچ کارمزدی نمی‌گیریم.",
  },
  {
    q: "تفاوت پلن رایگان و Pro چیست؟",
    a: "پلن رایگان تمام امکانات اصلی را دارد. پلن Pro ویژگی‌های پیشرفته‌تری مثل ویدیو پروفایل، دامنه اختصاصی، تقویم محتوایی، لینک زمان‌بندی‌شده و آنالیتیکس پیشرفته اضافه می‌کند.",
  },
  {
    q: "آیا می‌توانم دامنه اختصاصی خودم را وصل کنم؟",
    a: "بله، در پلن Pro می‌توانید دامنه اختصاصی مثل yourname.com را به صفحه بیو خود متصل کنید.",
  },
  {
    q: "اگر مشکلی داشتم چه کار کنم؟",
    a: "تیم پشتیبانی ویلینک ۲۴/۷ از طریق چت آنلاین، ایمیل و کانال پشتیبانی در بله در دسترس است.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section-padding" id="faq">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm"
               style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
            <span className="dot-orange" />
            سوالات پر تکرار
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white">
            پاسخ سوال‌های شما
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            هر چیزی که باید درباره ویلینک بدانید
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i}
              className={`glass-card overflow-hidden transition-all duration-300
                         ${open === i ? "shadow-lg" : ""}`}>
              <button
                className="w-full flex items-center justify-between p-6 text-right gap-4"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-semibold text-gray-900 dark:text-white text-base">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 text-accent
                             ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
