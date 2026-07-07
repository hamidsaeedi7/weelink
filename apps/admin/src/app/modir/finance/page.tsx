"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, fmtPrice, fmtDate } from "@/lib/api";
import { DollarSign, ShoppingCart, CreditCard, RefreshCw, Landmark, Percent } from "lucide-react";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
type PaymentStatus = "PAID" | "UNPAID" | "REFUNDED";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  shop: { name: string };
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

interface Subscription {
  id: string;
  user: { email?: string; phone?: string };
  plan: string;
  durationMonths: number;
  price: number;
  startsAt: string;
  expiresAt: string;
}

interface FinanceData {
  totalRevenue: number;
  totalOrders: number;
  activeSubscriptions: number;
  orders: Order[];
  subscriptions: Subscription[];
}

function orderStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { label: string; className: string }> = {
    PENDING: {
      label: "در انتظار",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    },
    CONFIRMED: {
      label: "تأیید شده",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    DELIVERED: {
      label: "تحویل داده شده",
      className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    },
    CANCELLED: {
      label: "لغو شده",
      className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function paymentStatusBadge(status: PaymentStatus) {
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    PAID: {
      label: "پرداخت شده",
      className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    },
    UNPAID: {
      label: "پرداخت نشده",
      className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    },
    REFUNDED: {
      label: "استرداد",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

interface GatewayRow {
  shopId: string;
  shopName: string;
  shopSlug: string;
  ownerEmail: string | null;
  ownerPhone: string | null;
  settlementSheba: string | null;
  settlementHolder: string | null;
  settlementBankName: string | null;
  transactionCount: number;
  gross: number;
  platformFee: number;
  net: number;
}

interface GatewayReport {
  rows: GatewayRow[];
  totals: { gross: number; platformFee: number; net: number; transactionCount: number };
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [gateway, setGateway] = useState<GatewayReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "subscriptions" | "gateway">("orders");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [result, gwResult] = await Promise.all([adminApi.getFinance(), adminApi.getGatewayReport()]);
      setData(result);
      setGateway(gwResult);
    } catch {
      console.error("خطا در دریافت اطلاعات مالی");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = [
    {
      label: "درآمد کل",
      value: data ? fmtPrice(data.totalRevenue) : "—",
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/40",
    },
    {
      label: "تعداد سفارشات",
      value: data ? data.totalOrders.toLocaleString("fa-IR") : "—",
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-900/40",
    },
    {
      label: "اشتراک‌ها",
      value: data ? (data.subscriptions?.length ?? 0).toLocaleString("fa-IR") : "—",
      icon: CreditCard,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-900/40",
    },
    {
      label: "کارمزد درگاه ویلینک",
      value: gateway ? fmtPrice(gateway.totals.platformFee) : "—",
      icon: Percent,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-100 dark:bg-purple-900/40",
    },
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">امور مالی</h1>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          بازخوانی
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="glass-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        {(["orders", "subscriptions", "gateway"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t === "orders" ? "سفارشات" : t === "subscriptions" ? "اشتراک‌ها" : "درگاه ویلینک"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card flex items-center justify-center h-48">
          <RefreshCw size={24} className="animate-spin text-orange-500" />
        </div>
      ) : tab === "orders" ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {["شماره سفارش", "مشتری", "فروشگاه", "مبلغ", "وضعیت", "پرداخت", "تاریخ"].map((h) => (
                    <th key={h} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.orders ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      هیچ سفارشی یافت نشد
                    </td>
                  </tr>
                ) : (
                  (data?.orders ?? []).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                        #{order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{order.customerName}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{order.shop.name}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {fmtPrice(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3">{orderStatusBadge(order.status)}</td>
                      <td className="px-4 py-3">{paymentStatusBadge(order.paymentStatus)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {fmtDate(order.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "subscriptions" ? (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {["کاربر", "پلن", "مدت (ماه)", "قیمت", "شروع", "پایان"].map((h) => (
                    <th key={h} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.subscriptions ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      هیچ اشتراکی یافت نشد
                    </td>
                  </tr>
                ) : (
                  (data?.subscriptions ?? []).map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {sub.user.email || sub.user.phone}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.plan === "PRO"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{sub.durationMonths}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {fmtPrice(sub.price)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDate(sub.startsAt)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{fmtDate(sub.expiresAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                <DollarSign size={22} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">فروش ناخالص</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{gateway ? fmtPrice(gateway.totals.gross) : "—"}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                <Percent size={22} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">کارمزد پلتفرم (۱۰٪)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{gateway ? fmtPrice(gateway.totals.platformFee) : "—"}</p>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <Landmark size={22} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">قابل واریز به فروشندگان</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{gateway ? fmtPrice(gateway.totals.net) : "—"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["فروشگاه", "مالک", "تراکنش", "ناخالص", "کارمزد", "خالص قابل تسویه", "شبا"].map((h) => (
                      <th key={h} className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(gateway?.rows ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        هنوز تراکنش موفقی از درگاه ویلینک ثبت نشده است
                      </td>
                    </tr>
                  ) : (
                    (gateway?.rows ?? []).map((r) => (
                      <tr key={r.shopId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {r.shopName}
                          <span className="block text-xs text-gray-400 font-mono" dir="ltr">{r.shopSlug}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.ownerEmail || r.ownerPhone || "—"}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.transactionCount.toLocaleString("fa-IR")}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{fmtPrice(r.gross)}</td>
                        <td className="px-4 py-3 text-purple-600 dark:text-purple-400">{fmtPrice(r.platformFee)}</td>
                        <td className="px-4 py-3 font-medium text-green-600 dark:text-green-400">{fmtPrice(r.net)}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs" dir="ltr">
                          {r.settlementSheba || <span className="text-red-500">ثبت نشده</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
