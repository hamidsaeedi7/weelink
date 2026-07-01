"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PaymentResultClient() {
  const sp = useSearchParams();
  const status = sp.get("status");
  const orderNumber = sp.get("orderNumber");
  const ref = sp.get("ref");

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
