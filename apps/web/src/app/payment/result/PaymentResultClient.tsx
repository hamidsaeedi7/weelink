"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, Download, KeyRound, Copy, LogIn } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function PaymentResultClient() {
  const sp = useSearchParams();
  const status = sp.get("status");
  const orderNumber = sp.get("orderNumber");
  const ref = sp.get("ref");
  const type = sp.get("type"); // DIGITAL_FILE | COURSE
  const downloadUrl = sp.get("downloadUrl");
  const license = sp.get("license");
  const courseId = sp.get("courseId");
  const shopSlug = sp.get("shopSlug");
  const [copied, setCopied] = useState(false);

  const copyLicense = () => {
    if (!license) return;
    navigator.clipboard.writeText(license);
    setCopied(true);
    toast.success("کد لایسنس کپی شد");
  };

  const success = status === "success";

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center
          ${success ? "bg-green-500/20 border border-green-500/30" : "bg-red-500/20 border border-red-500/30"}`}>
          {success
            ? <CheckCircle2 className="w-10 h-10 text-green-400" />
            : <XCircle className="w-10 h-10 text-red-400" />}
        </div>

        <div className="space-y-2">
          <h1 className={`text-2xl font-black ${success ? "text-green-400" : "text-red-400"}`}>
            {success ? "پرداخت موفق" : status === "cancelled" ? "پرداخت لغو شد" : "پرداخت ناموفق"}
          </h1>
          <p className="text-gray-500 text-sm">
            {success
              ? "سفارش شما با موفقیت ثبت شد"
              : "مشکلی در پرداخت پیش آمد. می‌توانید دوباره تلاش کنید."}
          </p>
        </div>

        {orderNumber && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2 text-sm text-right">
            <div className="flex justify-between text-gray-400">
              <span>{orderNumber}</span>
              <span>شماره سفارش</span>
            </div>
            {ref && (
              <div className="flex justify-between text-gray-500">
                <span className="font-mono text-xs truncate max-w-[160px]">{ref}</span>
                <span>کد پیگیری</span>
              </div>
            )}
          </div>
        )}

        {success && type === "DIGITAL_FILE" && downloadUrl && (
          <a href={downloadUrl}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-500 hover:bg-green-400
                       text-white font-bold text-sm transition-all">
            <Download className="w-4 h-4" /> دانلود فایل
          </a>
        )}

        {success && type === "COURSE" && license && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-3 text-right">
            <div className="flex items-center gap-2 text-sm font-bold text-white justify-center">
              <KeyRound className="w-4 h-4 text-orange-500" /> کد لایسنس شما
            </div>
            <button onClick={copyLicense}
              className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-black/20 border border-white/10 hover:border-orange-500/40">
              <span className="font-mono text-base tracking-widest text-white" dir="ltr">{license}</span>
              <Copy className="w-4 h-4 text-white/40" />
            </button>
            <p className="text-[11px] text-gray-400">
              {copied ? "کپی شد — " : ""}این کد را همراه شماره موبایلتان برای ورود به دوره نگه دارید.
            </p>
            {courseId && shopSlug && (
              <a href={`/${shopSlug}/course/${courseId}?license=${encodeURIComponent(license)}`}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all">
                <LogIn className="w-4 h-4" /> ورود به دوره
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!success && (
            <button onClick={() => window.history.back()}
              className="py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all">
              تلاش مجدد
            </button>
          )}
          <Link href="/"
            className="py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold
                       hover:border-orange-500/30 hover:text-orange-400 transition-all
                       flex items-center justify-center gap-2">
            <ArrowRight className="w-4 h-4" />
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </div>
  );
}
