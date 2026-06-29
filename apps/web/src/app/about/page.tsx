import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Heart, Zap, Shield, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "درباره ما | ویلینک",
  description: "ویلینک پلتفرم لینک بیو فارسی برای کسب‌وکارهای ایرانی است.",
};

const VALUES = [
  { icon: Heart, title: "ساخته شده برای ایرانی‌ها", desc: "هر چیزی که ساختیم برای نیازهای بازار ایران طراحی شده — از پیام‌رسان‌های داخلی تا درگاه‌های پرداخت." },
  { icon: Zap, title: "ساده و سریع", desc: "در کمتر از ۲ دقیقه فروشگاه و بیو لینک حرفه‌ای داشته باش. بدون نیاز به دانش فنی." },
  { icon: Shield, title: "امن و قابل اعتماد", desc: "داده‌های کاربران روی سرورهای ایمن نگه‌داری می‌شه. نماد اعتماد الکترونیکی داریم." },
  { icon: Users, title: "پشتیبانی واقعی", desc: "تیم ما ۷ روز هفته از طریق تلگرام و ایمیل پاسخگوی سوالاته." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0F]">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center py-16">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-orange-500/10 text-orange-500
                          px-3 py-1.5 rounded-full mb-6">
            درباره ما
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            ما اینجاییم تا کسب‌وکار<br />
            <span className="text-orange-500">آنلاین ایرانی</span> رو ساده کنیم
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            ویلینک در سال ۱۴۰۳ با یک هدف ساده شروع شد: یک ابزار فارسی، ارزان‌قیمت و کامل برای
            کسب‌وکارهای اینستاگرامی ایران که نیاز به لینک بیو حرفه‌ای دارن.
          </p>
        </section>

        {/* Story */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]
                          rounded-2xl p-8 space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              خیلی از صاحبان کسب‌وکار ایرانی از ابزارهای خارجی استفاده می‌کردن — ابزارهایی که
              نه فارسی داشتن، نه با پرداخت ایرانی کار می‌کردن، و نه پشتیبانی واقعی ارائه می‌دادن.
            </p>
            <p>
              ما تصمیم گرفتیم یه ابزار کامل بسازیم: لینک بیو، فروشگاه، آمار، کد تخفیف، سیستم سفارش
              و خیلی چیزهای دیگه — همه در یه جا، به فارسی، با درگاه پرداخت ایرانی.
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              نتیجه؟ ویلینک — یک لینک، همه چیز.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-10">
            ارزش‌های ما
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title}
                   className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]
                              rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <v.icon className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">
            آماده‌ای شروع کنی؟
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            ثبت‌نام رایگانه. بدون نیاز به کارت اعتباری.
          </p>
          <a href="/register"
             className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-400
                        text-white font-bold rounded-xl transition-all
                        shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]">
            شروع رایگان ←
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
