import { PackageOpen, Truck, CheckCircle, Clock, Package } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getTracking(orderId: string) {
  try {
    const res = await fetch(`${API}/api/v1/orders/${orderId}/tracking`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "در انتظار",         color: "text-yellow-600", bg: "bg-yellow-100" },
  CONFIRMED:  { label: "تأیید شده",         color: "text-blue-600",   bg: "bg-blue-100" },
  PROCESSING: { label: "در حال آماده‌سازی", color: "text-purple-600", bg: "bg-purple-100" },
  SHIPPED:    { label: "ارسال شده",         color: "text-cyan-600",   bg: "bg-cyan-100" },
  DELIVERED:  { label: "تحویل داده شده",    color: "text-green-700",  bg: "bg-green-100" },
  CANCELLED:  { label: "لغو شده",           color: "text-red-600",    bg: "bg-red-100" },
};

const CARRIER_LABELS: Record<string, string> = {
  post:   "اداره پست",
  tipax:  "تیپاکس",
  chapar: "چاپار",
  peyk:   "پیک موتوری",
  other:  "سایر",
};

function TimelineIcon({ status }: { status: string }) {
  const cls = "w-5 h-5";
  if (status === "DELIVERED") return <CheckCircle className={cls} />;
  if (status === "SHIPPED")   return <Truck className={cls} />;
  if (status === "PENDING")   return <Clock className={cls} />;
  return <PackageOpen className={cls} />;
}

function persianDate(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function TrackingPage({ params }: { params: { orderId: string } }) {
  const data = await getTracking(params.orderId);
  const st = data ? (STATUS_LABELS[data.status] || { label: data.status, color: "text-gray-600", bg: "bg-gray-100" }) : null;
  const history: any[] = data?.trackingHistory ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4" dir="rtl">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500/10 rounded-2xl mb-2">
            <Package className="w-7 h-7 text-orange-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">ردیابی مرسوله</h1>
          {data && (
            <p className="text-sm text-gray-500 font-mono">{data.orderNumber}</p>
          )}
        </div>

        {!data ? (
          <div className="bg-white dark:bg-white/5 rounded-2xl p-10 text-center border border-gray-100 dark:border-white/5">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">سفارش یافت نشد یا اطلاعاتی در دسترس نیست.</p>
          </div>
        ) : (
          <>
            {/* Order summary card */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">وضعیت سفارش</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${st!.bg} ${st!.color}`}>
                  {st!.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">فروشگاه</span>
                <span className="text-sm font-bold text-gray-800 dark:text-white">{data.shopName}</span>
              </div>

              {data.carrier && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">شرکت حمل‌ونقل</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-white">
                    {CARRIER_LABELS[data.carrier] ?? data.carrier}
                  </span>
                </div>
              )}

              {data.trackingCode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">کد رهگیری</span>
                  <span className="text-sm font-mono font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-lg">
                    {data.trackingCode}
                  </span>
                </div>
              )}

              {data.estimatedDelivery && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">تحویل تخمینی</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(data.estimatedDelivery).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-5">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">تاریخچه وضعیت</h2>

              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-sm">اطلاعات ردیابی هنوز ثبت نشده است</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {[...history].reverse().map((event: any, i: number) => {
                    const isLatest = i === 0;
                    const evStatus = STATUS_LABELS[event.status];
                    return (
                      <div key={i} className="flex gap-4 pb-6 last:pb-0 relative">
                        {/* Line */}
                        {i < history.length - 1 && (
                          <div className="absolute right-[19px] top-8 bottom-0 w-0.5 bg-gray-100 dark:bg-white/5" />
                        )}

                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10
                          ${isLatest
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 dark:bg-white/10 text-gray-400"}`}>
                          <TimelineIcon status={event.status} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-bold ${isLatest ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}>
                              {evStatus?.label ?? event.status}
                            </span>
                            {event.location && (
                              <span className="text-xs text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                {event.location}
                              </span>
                            )}
                          </div>
                          {event.note && (
                            <p className="text-xs text-gray-500 mt-0.5">{event.note}</p>
                          )}
                          <p className="text-[11px] text-gray-400 mt-1">{persianDate(event.timestamp)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shop footer */}
            <div className="text-center text-xs text-gray-400 space-y-1 pb-6">
              <p>این سفارش توسط فروشگاه <span className="font-bold text-orange-500">{data.shopName}</span> پردازش می‌شود.</p>
              <p>powered by <span className="font-bold">weeelink.ir</span></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
