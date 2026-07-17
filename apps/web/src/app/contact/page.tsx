"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, MessageCircle, Send, Loader2, CheckCircle } from "lucide-react";

const CHANNELS = [
  {
    icon: MessageCircle,
    title: "تلگرام",
    desc: "سریع‌ترین راه ارتباطی",
    link: "https://t.me/weelink_support",
    label: "@weelink_support",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Mail,
    title: "ایمیل",
    desc: "پاسخ تا ۲۴ ساعت",
    link: "mailto:support@weeelink.com",
    label: "support@weeelink.com",
    color: "text-orange-500 bg-orange-500/10",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("نام خود را وارد کنید"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("ایمیل معتبر وارد کنید"); return; }
    if (!form.subject.trim()) { setError("موضوع پیام را وارد کنید"); return; }
    if (!form.message.trim()) { setError("متن پیام را وارد کنید"); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0F]">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Header */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 text-center py-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-orange-500/10 text-orange-500
                          px-3 py-1.5 rounded-full mb-6">
            تماس با ما
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
            چطور می‌تونیم کمکت کنیم؟
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            تیم پشتیبانی ما ۷ روز هفته آماده پاسخ‌گویی هست.
          </p>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Channels */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">راه‌های ارتباطی</h2>
            {CHANNELS.map((ch) => (
              <a key={ch.title} href={ch.link} target="_blank" rel="noopener noreferrer"
                 className="flex items-start gap-4 p-5 bg-white dark:bg-white/[0.03]
                            border border-gray-200 dark:border-white/[0.06] rounded-2xl
                            hover:border-orange-500/30 transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ch.color}`}>
                  <ch.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{ch.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ch.desc}</p>
                  <p className="text-xs text-orange-500 mt-1.5 font-medium group-hover:underline">
                    {ch.label}
                  </p>
                </div>
              </a>
            ))}

            <div className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-2xl">
              <p className="text-sm font-bold text-orange-500 mb-1">ساعات پاسخ‌گویی</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">شنبه تا پنج‌شنبه: ۹ صبح تا ۱۰ شب</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">جمعه: ۱۰ صبح تا ۶ عصر</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]
                            rounded-2xl p-6 sm:p-8">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">پیام ارسال شد!</h3>
                  <p className="text-sm text-gray-500">تا ۲۴ ساعت پاسخ می‌دیم.</p>
                  <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="mt-6 text-sm text-orange-500 hover:text-orange-400 transition-colors">
                    ارسال پیام جدید
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <h2 className="font-bold text-gray-900 dark:text-white mb-6">ارسال پیام</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        نام
                      </label>
                      <input
                        value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }}
                        placeholder="نام شما"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5
                                   border border-gray-200 dark:border-white/10 text-sm
                                   focus:outline-none focus:border-orange-500/50 focus:ring-2
                                   focus:ring-orange-500/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        ایمیل
                      </label>
                      <input
                        value={form.email} onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(""); }}
                        type="email" placeholder="email@example.com" dir="ltr"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5
                                   border border-gray-200 dark:border-white/10 text-sm
                                   focus:outline-none focus:border-orange-500/50 focus:ring-2
                                   focus:ring-orange-500/10 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      موضوع
                    </label>
                    <input
                      value={form.subject} onChange={(e) => { setForm((f) => ({ ...f, subject: e.target.value })); setError(""); }}
                      placeholder="موضوع پیام"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5
                                 border border-gray-200 dark:border-white/10 text-sm
                                 focus:outline-none focus:border-orange-500/50 focus:ring-2
                                 focus:ring-orange-500/10 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      پیام
                    </label>
                    <textarea
                      value={form.message} onChange={(e) => { setForm((f) => ({ ...f, message: e.target.value })); setError(""); }}
                      rows={5} placeholder="پیام خود را بنویسید..."
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5
                                 border border-gray-200 dark:border-white/10 text-sm
                                 focus:outline-none focus:border-orange-500/50 focus:ring-2
                                 focus:ring-orange-500/10 transition-all resize-none" />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded-lg">
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3
                               bg-orange-500 hover:bg-orange-400 disabled:opacity-60
                               text-white font-bold rounded-xl transition-all
                               shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال ارسال...</>
                      : <><Send className="w-4 h-4" /> ارسال پیام</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
