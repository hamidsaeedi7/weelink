"use client";

import { useState, useEffect } from "react";
import { Loader2, ShoppingBag, ChevronDown, Truck, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { formatPrice, toPersianNumber, timeAgo } from "@/lib/utils";
import ShippingModal from "./ShippingModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:    { label: "در انتظار",  color: "bg-yellow-500/20 text-yellow-400" },
  CONFIRMED:  { label: "تأیید شده", color: "bg-blue-500/20 text-blue-400" },
  PROCESSING: { label: "در حال آماده‌سازی", color: "bg-purple-500/20 text-purple-400" },
  SHIPPED:    { label: "ارسال شده", color: "bg-cyan-500/20 text-cyan-400" },
  DELIVERED:  { label: "تحویل داده شده", color: "bg-green-500/20 text-green-400" },
  CANCELLED:  { label: "لغو شده",   color: "bg-red-500/20 text-red-400" },
};

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [shippingOrderNumber, setShippingOrderNumber] = useState<string | undefined>();

  const load = async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const { data } = await axios.get(`${API}/api/v1/orders/mine${params}`, { headers: authHeaders() });
      const result = data.data || data;
      setOrders(result.orders || result);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  };

  useEffect(() => { setLoading(true); load(); }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const { data } = await axios.put(`${API}/api/v1/orders/${id}/status`, { status }, { headers: authHeaders() });
      const updated = data.data || data;
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: updated.status } : o));
      toast.success("وضعیت بروز شد");
    } catch { toast.error("خطا"); }
    finally { setUpdating(null); }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">سفارش‌ها</h1>
          <p className="text-sm text-gray-500">{toPersianNumber(orders.length)} سفارش</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-base text-sm max-w-[160px]">
          <option value="">همه وضعیت‌ها</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center h-48 items-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto opacity-20" />
          <p>سفارشی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-500/20 text-gray-400" };
            const isOpen = expanded === order.id;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div key={order.id}
                className="bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {/* Order Header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-right"
                  onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.color}`}>
                        {st.label}
                      </span>
                      {order.paymentStatus === "PAID" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold">پرداخت شده</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-bold text-gray-900 dark:text-white">{order.customerName}</span>
                      <span className="text-gray-400 font-mono text-xs">{order.customerPhone}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-accent-500 text-sm">{formatPrice(order.totalPrice)}</p>
                    <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Expanded Detail */}
                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-white/5 px-5 py-4 space-y-4">
                    {/* Items */}
                    <div className="space-y-2">
                      {items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{item.name} × {toPersianNumber(item.qty)}</span>
                          <span>{formatPrice(item.price * item.qty)}</span>
                        </div>
                      ))}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>تخفیف {order.couponCode && `(${order.couponCode})`}</span>
                          <span>- {formatPrice(order.discount)}</span>
                        </div>
                      )}
                    </div>

                    {order.customerAddress && (
                      <p className="text-xs text-gray-500 border-t border-gray-100 dark:border-white/5 pt-2">
                        آدرس: {order.customerAddress}
                      </p>
                    )}
                    {order.note && (
                      <p className="text-xs text-gray-400">یادداشت: {order.note}</p>
                    )}

                    {/* Status actions */}
                    <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
                      {STATUS_FLOW.filter((s) => s !== order.status && s !== "CANCELLED").map((s) => (
                        <button key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={updating === order.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-white/10
                                     text-gray-600 dark:text-gray-400 hover:border-accent-500/40 hover:text-accent-500
                                     transition-all disabled:opacity-40">
                          {updating === order.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : STATUS_LABELS[s].label}
                        </button>
                      ))}
                      {order.status !== "CANCELLED" && (
                        <button onClick={() => updateStatus(order.id, "CANCELLED")}
                          disabled={updating === order.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 dark:border-red-500/20
                                     text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                          لغو سفارش
                        </button>
                      )}
                    </div>

                    {/* Shipping & Invoice actions */}
                    <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
                      {/* Shipping button — shows carrier chip if tracking exists */}
                      <button
                        onClick={() => { setShippingOrderId(order.id); setShippingOrderNumber(order.orderNumber); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                                   bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400
                                   border border-cyan-200 dark:border-cyan-500/20 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-all">
                        <Truck className="w-3.5 h-3.5" />
                        {order.trackingCode
                          ? <span>{order.carrier ?? "ردیابی"} · {order.trackingCode}</span>
                          : "ردیابی مرسوله"}
                      </button>

                      {/* Invoice button */}
                      <a
                        href={`${API}/api/v1/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          // attach auth header via fetch + blob URL since it's a protected endpoint
                          e.preventDefault();
                          const token = localStorage.getItem("access_token");
                          fetch(`${API}/api/v1/orders/${order.id}/invoice`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          })
                            .then((r) => r.text())
                            .then((html) => {
                              const w = window.open("", "_blank");
                              if (w) { w.document.write(html); w.document.close(); }
                            })
                            .catch(() => toast.error("خطا در دریافت فاکتور"));
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                                   bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400
                                   border border-accent-200 dark:border-accent-500/20 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all">
                        <FileText className="w-3.5 h-3.5" />
                        فاکتور
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {shippingOrderId && (
      <ShippingModal
        orderId={shippingOrderId}
        orderNumber={shippingOrderNumber}
        onClose={() => { setShippingOrderId(null); setShippingOrderNumber(undefined); }}
        onSaved={() => load()}
      />
    )}
    </>
  );
}
