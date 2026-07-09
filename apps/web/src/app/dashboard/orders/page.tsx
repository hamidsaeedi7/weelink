"use client";

import { useState, useEffect } from "react";
import { Loader2, ShoppingBag, ChevronDown, Truck, FileText, Download, FileDown, BookOpen, CheckCircle2 } from "lucide-react";
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

type Period = "week" | "month" | "year";
const PERIOD_LABELS: Record<Period, string> = { week: "هفتگی", month: "ماهانه", year: "سالانه" };
const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, year: 365 };

function withinPeriod(dateStr: string, period: Period) {
  const days = PERIOD_DAYS[period];
  const cutoff = Date.now() - days * 86400 * 1000;
  return new Date(dateStr).getTime() >= cutoff;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  toast.success("فایل اکسل دانلود شد");
}

// ─── Tab: Physical products (کارت سفارش کامل با وضعیت/ارسال/فاکتور) ───────────
function PhysicalOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [shippingOrderNumber, setShippingOrderNumber] = useState<string | undefined>();
  const [period, setPeriod] = useState<Period>("month");

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

  const markPaid = async (id: string) => {
    setUpdating(id);
    try {
      await axios.put(`${API}/api/v1/orders/${id}/mark-paid`, {}, { headers: authHeaders() });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, paymentStatus: "PAID" } : o));
      toast.success("پرداخت تأیید شد");
    } catch { toast.error("خطا"); }
    finally { setUpdating(null); }
  };

  const exportOrders = () => {
    const filtered = orders.filter((o) => withinPeriod(o.createdAt, period));
    const rows: (string | number)[][] = [["شماره سفارش", "مشتری", "موبایل", "مبلغ", "روش پرداخت", "وضعیت پرداخت", "وضعیت سفارش", "آدرس", "کد پستی", "تاریخ"]];
    filtered.forEach((o) => rows.push([
      o.orderNumber, o.customerName, o.customerPhone, o.totalPrice,
      o.paymentMethod === "GATEWAY" ? "درگاه" : "کارت به کارت",
      o.paymentStatus === "PAID" ? "پرداخت شده" : "پرداخت‌نشده",
      STATUS_LABELS[o.status]?.label || o.status,
      o.customerAddress || "", o.customerPostalCode || "",
      new Date(o.createdAt).toLocaleDateString("fa-IR"),
    ]));
    downloadCSV(`orders-physical-${period}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">{toPersianNumber(orders.length)} سفارش</p>
        <div className="space-y-2">
          {/* بازه زمانی و وضعیت — هم‌تراز در یک ردیف؛ خروجی اکسل زیرشان */}
          <div className="grid grid-cols-2 gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}
              className="input-base text-sm">
              {(["week", "month", "year"] as Period[]).map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-base text-sm">
              <option value="">همه وضعیت‌ها</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
              ))}
            </select>
          </div>
          <button onClick={exportOrders}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-sm font-bold hover:bg-green-500/20 transition-all">
            <Download className="w-4 h-4" /> خروجی اکسل
          </button>
        </div>
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
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-right"
                  onClick={() => setExpanded(isOpen ? null : order.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.color}`}>
                        {st.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 font-bold">
                        {order.paymentMethod === "GATEWAY" ? "درگاه" : "کارت به کارت"}
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

                {isOpen && (
                  <div className="border-t border-gray-100 dark:border-white/5 px-5 py-4 space-y-4">
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
                        آدرس: {order.customerAddress} {order.customerPostalCode && `— کد پستی: ${order.customerPostalCode}`}
                      </p>
                    )}
                    {order.note && (
                      <p className="text-xs text-gray-400">یادداشت: {order.note}</p>
                    )}

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

                    <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-white/5 pt-3">
                      {order.paymentMethod === "CARD_TO_CARD" && order.paymentStatus !== "PAID" && (
                        <button onClick={() => markPaid(order.id)} disabled={updating === order.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                                     bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400
                                     border border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20 transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5" /> تأیید پرداخت کارت‌به‌کارت
                        </button>
                      )}

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

                      <a
                        href={`${API}/api/v1/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
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

      {shippingOrderId && (
        <ShippingModal
          orderId={shippingOrderId}
          orderNumber={shippingOrderNumber}
          onClose={() => { setShippingOrderId(null); setShippingOrderNumber(undefined); }}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}

// ─── Tab: Digital files (لیست خریداران فایل دیجیتال) ──────────────────────────
function DigitalPurchasesTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    axios.get(`${API}/api/v1/digital-files/purchases`, { headers: authHeaders() })
      .then(({ data }) => setRows(data.data || data || []))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const exportRows = () => {
    const filtered = rows.filter((r) => withinPeriod(r.createdAt, period));
    const out: (string | number)[][] = [["فایل", "خریدار", "موبایل", "مبلغ", "کد تخفیف", "وضعیت", "تاریخ"]];
    filtered.forEach((r) => out.push([
      r.fileTitle, r.customerName || "", r.customerPhone, r.amountPaid,
      r.couponCode || "", r.paymentStatus === "PAID" ? "پرداخت شده" : "پرداخت‌نشده",
      new Date(r.createdAt).toLocaleDateString("fa-IR"),
    ]));
    downloadCSV(`orders-digital-files-${period}.csv`, out);
  };

  if (loading) return <div className="flex justify-center h-48 items-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">{toPersianNumber(rows.length)} خرید</p>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="input-base text-sm max-w-[120px]">
            {(["week", "month", "year"] as Period[]).map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
          </select>
          <button onClick={exportRows}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-sm font-bold hover:bg-green-500/20 transition-all">
            <Download className="w-4 h-4" /> خروجی اکسل
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-3">
          <FileDown className="w-12 h-12 mx-auto opacity-20" />
          <p>هنوز خریدی ثبت نشده است</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 px-5 py-3.5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{r.fileTitle}</p>
                <p className="text-xs text-gray-400">{timeAgo(r.createdAt)}</p>
              </div>
              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-300">{r.customerName}</span>
                <span className="text-gray-400 font-mono text-xs mr-2">{r.customerPhone}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.paymentStatus === "PAID" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                {r.paymentStatus === "PAID" ? "پرداخت شده" : "پرداخت‌نشده"}
              </span>
              <p className="font-black text-accent-500 text-sm">{formatPrice(r.amountPaid)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Courses (لیست ثبت‌نام‌کنندگان دوره) ──────────────────────────────────
function CourseEnrollmentsTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    axios.get(`${API}/api/v1/courses/enrollments`, { headers: authHeaders() })
      .then(({ data }) => setRows(data.data || data || []))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const exportRows = () => {
    const filtered = rows.filter((r) => withinPeriod(r.createdAt, period));
    const out: (string | number)[][] = [["دوره", "دانشجو", "موبایل", "مبلغ", "کد تخفیف", "کد لایسنس", "وضعیت", "تاریخ"]];
    filtered.forEach((r) => out.push([
      r.courseTitle, r.customerName || "", r.customerPhone, r.amountPaid,
      r.couponCode || "", r.licenseCode || "", r.paymentStatus === "PAID" ? "پرداخت شده" : "پرداخت‌نشده",
      new Date(r.createdAt).toLocaleDateString("fa-IR"),
    ]));
    downloadCSV(`orders-courses-${period}.csv`, out);
  };

  if (loading) return <div className="flex justify-center h-48 items-center"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">{toPersianNumber(rows.length)} ثبت‌نام</p>
        <div className="flex items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="input-base text-sm max-w-[120px]">
            {(["week", "month", "year"] as Period[]).map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
          </select>
          <button onClick={exportRows}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-sm font-bold hover:bg-green-500/20 transition-all">
            <Download className="w-4 h-4" /> خروجی اکسل
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-gray-400 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto opacity-20" />
          <p>هنوز ثبت‌نامی انجام نشده است</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 px-5 py-3.5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{r.courseTitle}</p>
                <p className="text-xs text-gray-400">{timeAgo(r.createdAt)}</p>
              </div>
              <div className="text-sm">
                <span className="font-bold text-gray-700 dark:text-gray-300">{r.customerName}</span>
                <span className="text-gray-400 font-mono text-xs mr-2">{r.customerPhone}</span>
              </div>
              {r.licenseCode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-500 font-mono font-bold">{r.licenseCode}</span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.paymentStatus === "PAID" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                {r.paymentStatus === "PAID" ? "پرداخت شده" : "پرداخت‌نشده"}
              </span>
              <p className="font-black text-accent-500 text-sm">{formatPrice(r.amountPaid)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Tab = "physical" | "digital" | "courses";

export default function OrdersPage() {
  const [tab, setTab] = useState<Tab>("physical");
  const TABS: { id: Tab; label: string }[] = [
    { id: "physical", label: "محصولات فیزیکی" },
    { id: "digital", label: "فایل‌های دیجیتال" },
    { id: "courses", label: "دوره‌های آموزشی" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">سفارش‌ها</h1>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "physical" && <PhysicalOrdersTab />}
      {tab === "digital" && <DigitalPurchasesTab />}
      {tab === "courses" && <CourseEnrollmentsTab />}
    </div>
  );
}
