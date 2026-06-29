import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { PlayCircle, Clock, BookOpen, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "آموزش ویلینک",
  description: "ویدیوهای آموزشی ویلینک — راهنمای ساخت صفحه بیو و فروشگاه اینستاگرامی",
};

const UPCOMING_TOPICS = [
  { icon: "🚀", title: "راه‌اندازی اولیه ویلینک", duration: "۵ دقیقه", status: "به‌زودی" },
  { icon: "🛍️", title: "ساخت فروشگاه اینستاگرامی", duration: "۱۰ دقیقه", status: "به‌زودی" },
  { icon: "🔗", title: "مدیریت لینک‌ها و بلوک‌ها", duration: "۷ دقیقه", status: "به‌زودی" },
  { icon: "📊", title: "بررسی آنالیتیکس و آمار", duration: "۸ دقیقه", status: "به‌زودی" },
  { icon: "💳", title: "تنظیم درگاه پرداخت", duration: "۶ دقیقه", status: "به‌زودی" },
  { icon: "📱", title: "اتصال پیام‌رسان‌های ایرانی", duration: "۵ دقیقه", status: "به‌زودی" },
];

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0F] bg-dot-pattern">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm"
                 style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
              <PlayCircle className="w-4 h-4" />
              آموزش‌های ویدیویی
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              آموزش ویلینک
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              راهنمای گام‌به‌گام استفاده از ویلینک — از ساخت صفحه بیو تا راه‌اندازی فروشگاه آنلاین
            </p>
          </div>

          {/* Coming Soon Banner */}
          <div className="glass-card p-8 text-center mb-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl"
                 style={{ background: "var(--accent-glow)" }}>
              🎬
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ویدیوهای آموزشی در حال تهیه است
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              به‌زودی مجموعه‌ای از ویدیوهای آموزشی کوتاه و کاربردی اینجا قرار می‌گیرد.
              همین حالا می‌توانید از طریق مستندات شروع کنید.
            </p>
            <Link href="/" className="btn-primary inline-flex mt-2">
              شروع رایگان
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Upcoming Topics */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              سرفصل‌های آموزشی
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {UPCOMING_TOPICS.map((topic, i) => (
                <div key={i} className="glass-card p-5 space-y-3 opacity-75">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{topic.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5
                                     text-gray-500 dark:text-gray-400 font-medium">
                      {topic.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">{topic.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{topic.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
