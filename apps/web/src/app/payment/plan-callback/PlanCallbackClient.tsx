"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { paymentsApi } from "@/lib/api";

export default function PlanCallbackClient() {
  const sp = useSearchParams();
  const [phase, setPhase] = useState<"verifying" | "success" | "error">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    const trackId = sp.get("trackId") || "";
    const success = sp.get("success") || "";

    if (!trackId) {
      setError("اطلاعات تراکنش ناقص است");
      setPhase("error");
      return;
    }

    paymentsApi.verifyPlanPayment(trackId, success)
      .then(() => setPhase("success"))
      .catch((e: any) => {
        setError(e?.message || "تأیید پرداخت ناموفق بود");
        setPhase("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center
          ${phase === "success" ? "bg-green-500/20 border border-green-500/30"
            : phase === "error" ? "bg-red-500/20 border border-red-500/30"
            : "bg-orange-500/10 border border-orange-500/20"}`}>
          {phase === "success" && <CheckCircle2 className="w-10 h-10 text-green-400" />}
          {phase === "error" && <XCircle className="w-10 h-10 text-red-400" />}
          {phase === "verifying" && <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />}
        </div>

        <div className="space-y-2">
          <h1 className={`text-2xl font-black ${
            phase === "success" ? "text-green-400" : phase === "error" ? "text-red-400" : "text-white"
          }`}>
            {phase === "verifying" && "در حال تأیید پرداخت..."}
            {phase === "success" && "پرداخت موفق"}
            {phase === "error" && "پرداخت ناموفق"}
          </h1>
          <p className="text-gray-500 text-sm">
            {phase === "verifying" && "لطفاً چند لحظه صبر کنید"}
            {phase === "success" && "حساب PRO شما فعال شد 🎉"}
            {phase === "error" && error}
          </p>
        </div>

        {phase !== "verifying" && (
          <div className="flex flex-col gap-3">
            {phase === "error" && (
              <Link href="/dashboard/plans"
                className="py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all">
                تلاش مجدد
              </Link>
            )}
            <Link href="/dashboard/plans"
              className="py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold
                         hover:border-orange-500/30 hover:text-orange-400 transition-all
                         flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" />
              بازگشت به پلن‌ها
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
