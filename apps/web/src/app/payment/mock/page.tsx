"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, X, Loader2 } from "lucide-react";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MockPaymentPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const authority = sp.get("authority") || "";
  const orderNumber = sp.get("orderNumber") || "";
  const amount = Number(sp.get("amount") || 0);
  const [processing, setProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handlePay = async () => {
    setProcessing(true);
    try {
      await axios.post(`${API}/api/v1/payments/verify`, { authority, orderNumber });
      router.push(`/payment/result?status=success&orderNumber=${orderNumber}&ref=${authority}`);
    } catch {
      router.push(`/payment/result?status=failed&orderNumber=${orderNumber}`);
    }
  };

  const handleCancel = () => {
    router.push(`/payment/result?status=cancelled&orderNumber=${orderNumber}`);
  };

  // Auto-close countdown display (not auto-pay)
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Bank Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30
                          flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-orange-400" />
          </div>
          <p className="text-xs text-gray-500 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5 inline-block">
            🔒 درگاه آزمایشی ویلینک — محیط توسعه
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">شماره سفارش</p>
              <p className="font-mono text-white text-sm">{orderNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">مبلغ پرداختی</p>
              <p className="text-3xl font-black text-orange-400">{formatPrice(amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500">کد پیگیری</p>
              <p className="font-mono text-xs text-gray-400 break-all">{authority}</p>
            </div>
          </div>

          {/* Fake card input */}
          <div className="px-6 pb-6 space-y-3">
            <input
              placeholder="شماره کارت"
              defaultValue="6219 8610 3452 7890"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm font-mono text-center focus:outline-none
                         focus:border-orange-500/50"
              dir="ltr"
              readOnly
            />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="تاریخ انقضا" defaultValue="02/29"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-white text-sm font-mono text-center focus:outline-none" readOnly />
              <input placeholder="CVV2" defaultValue="***"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3
                           text-white text-sm font-mono text-center focus:outline-none" readOnly />
            </div>
            <input placeholder="رمز دوم" defaultValue="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                         text-white text-sm font-mono text-center focus:outline-none" readOnly />
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-xl border border-red-500/30 text-red-400
                         text-sm font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
              <X className="w-4 h-4" />
              انصراف
            </button>
            <button
              onClick={handlePay}
              disabled={processing}
              className="flex-2 flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400
                         text-white text-sm font-bold transition-all
                         flex items-center justify-center gap-2
                         shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              {processing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> در حال پرداخت...</>
                : "پرداخت"}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600">
          این درگاه آزمایشی است. هیچ مبلغی کسر نمی‌شود.
        </p>
      </div>
    </div>
  );
}
