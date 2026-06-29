"use client";

import { useState, useEffect } from "react";
import { X, Truck, Plus, Loader2, PackageOpen, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const CARRIERS = [
  { value: "post",   label: "اداره پست" },
  { value: "tipax",  label: "تیپاکس" },
  { value: "chapar", label: "چاپار" },
  { value: "peyk",   label: "پیک موتوری" },
  { value: "other",  label: "سایر" },
];

const UPDATE_STATUSES = [
  { value: "PROCESSING", label: "در حال آماده‌سازی" },
  { value: "SHIPPED",    label: "ارسال شده" },
  { value: "DELIVERED",  label: "تحویل داده شده" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "در انتظار",
  CONFIRMED:  "تأیید شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED:    "ارسال شده",
  DELIVERED:  "تحویل داده شده",
  CANCELLED:  "لغو شده",
};

function TimelineIcon({ status }: { status: string }) {
  const cls = "w-4 h-4";
  if (status === "DELIVERED") return <CheckCircle className={cls} />;
  if (status === "SHIPPED")   return <Truck className={cls} />;
  if (status === "PENDING")   return <Clock className={cls} />;
  return <PackageOpen className={cls} />;
}

function persianDate(iso: string) {
  return new Date(iso).toLocaleDateString("fa-IR", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ShippingModal({ orderId, orderNumber, onClose, onSaved }: Props) {
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form: add tracking
  const [carrier, setCarrier] = useState("post");
  const [trackingCode, setTrackingCode] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [saving, setSaving] = useState(false);

  // Form: add update
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updStatus, setUpdStatus] = useState("SHIPPED");
  const [updNote, setUpdNote] = useState("");
  const [updLocation, setUpdLocation] = useState("");
  const [addingUpdate, setAddingUpdate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/v1/orders/${orderId}/tracking`, {
        headers: authHeaders(),
      });
      setTracking(data);
      if (data.carrier) setCarrier(data.carrier);
      if (data.trackingCode) setTrackingCode(data.trackingCode);
    } catch {
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [orderId]);

  const saveTracking = async () => {
    if (!trackingCode.trim()) { toast.error("کد رهگیری را وارد کنید"); return; }
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/v1/orders/${orderId}/tracking`,
        { carrier, trackingCode, estimatedDelivery: estimatedDelivery || undefined },
        { headers: authHeaders() },
      );
      toast.success("اطلاعات ارسال ثبت شد");
      onSaved?.();
      load();
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const addUpdate = async () => {
    setAddingUpdate(true);
    try {
      await axios.post(
        `${API}/api/v1/orders/${orderId}/tracking/update`,
        { status: updStatus, note: updNote, location: updLocation || undefined },
        { headers: authHeaders() },
      );
      toast.success("وضعیت اضافه شد");
      setUpdNote(""); setUpdLocation(""); setShowUpdateForm(false);
      load();
    } catch { toast.error("خطا"); }
    finally { setAddingUpdate(false); }
  };

  const history: any[] = tracking?.trackingHistory ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              ردیابی مرسوله
            </h2>
            {orderNumber && <p className="text-xs text-gray-400 font-mono mt-0.5">{orderNumber}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              {/* Tracking form */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">اطلاعات ارسال</h3>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">شرکت حمل‌ونقل</label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5
                               text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40">
                    {CARRIERS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">کد رهگیری</label>
                  <input
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="مثال: 123456789"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5
                               text-gray-900 dark:text-white px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/40" />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">تاریخ تحویل تخمینی (اختیاری)</label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5
                               text-gray-900 dark:text-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40" />
                </div>

                <button
                  onClick={saveTracking}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm
                             hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                  ذخیره اطلاعات ارسال
                </button>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">تاریخچه وضعیت</h3>
                  <button
                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                    className="flex items-center gap-1 text-xs text-orange-500 font-bold hover:text-orange-600 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    افزودن وضعیت
                  </button>
                </div>

                {/* Add update form */}
                {showUpdateForm && (
                  <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4 space-y-3 border border-orange-200/50 dark:border-orange-500/20">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">وضعیت جدید</label>
                      <select
                        value={updStatus}
                        onChange={(e) => setUpdStatus(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5
                                   text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40">
                        {UPDATE_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">توضیحات (اختیاری)</label>
                      <textarea
                        value={updNote}
                        onChange={(e) => setUpdNote(e.target.value)}
                        rows={2}
                        placeholder="مثال: بسته به مرکز پستی تحویل داده شد"
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5
                                   text-gray-900 dark:text-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">موقعیت (اختیاری)</label>
                      <input
                        value={updLocation}
                        onChange={(e) => setUpdLocation(e.target.value)}
                        placeholder="مثال: تهران، مرکز پستی"
                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5
                                   text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40" />
                    </div>
                    <button
                      onClick={addUpdate}
                      disabled={addingUpdate}
                      className="w-full py-2 rounded-lg bg-orange-500 text-white font-bold text-sm
                                 hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {addingUpdate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      ثبت وضعیت
                    </button>
                  </div>
                )}

                {/* History list */}
                {history.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4">هنوز وضعیتی ثبت نشده است</p>
                ) : (
                  <div className="space-y-0">
                    {[...history].reverse().map((event: any, i: number) => {
                      const isLatest = i === 0;
                      return (
                        <div key={i} className="flex gap-3 pb-4 last:pb-0 relative">
                          {i < history.length - 1 && (
                            <div className="absolute right-[15px] top-7 bottom-0 w-0.5 bg-gray-100 dark:bg-white/5" />
                          )}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10
                            ${isLatest ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-400"}`}>
                            <TimelineIcon status={event.status} />
                          </div>
                          <div className="flex-1 pt-1 min-w-0">
                            <p className={`text-xs font-bold ${isLatest ? "text-orange-500" : "text-gray-700 dark:text-gray-300"}`}>
                              {STATUS_LABELS[event.status] ?? event.status}
                              {event.location && (
                                <span className="text-gray-400 font-normal mr-1">· {event.location}</span>
                              )}
                            </p>
                            {event.note && <p className="text-[11px] text-gray-500 mt-0.5">{event.note}</p>}
                            <p className="text-[10px] text-gray-400 mt-0.5">{persianDate(event.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Public tracking link */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1.5">لینک ردیابی عمومی</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-lg flex-1 truncate" suppressHydrationWarning>
                    {typeof window !== "undefined" ? window.location.origin : ""}/tracking/{orderId}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/tracking/${orderId}`);
                      toast.success("لینک کپی شد");
                    }}
                    className="text-xs text-gray-500 hover:text-orange-500 transition-colors px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10">
                    کپی
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
