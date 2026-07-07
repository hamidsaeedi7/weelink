"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, CalendarCheck, X, Clock, Users, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ShareBar } from "@/components/ShareBar";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "در انتظار",   color: "bg-yellow-500/20 text-yellow-500" },
  CONFIRMED: { label: "تأیید شده",  color: "bg-blue-500/20 text-blue-500" },
  DONE:      { label: "انجام شد",   color: "bg-green-500/20 text-green-500" },
  CANCELLED: { label: "لغو شده",    color: "bg-red-500/20 text-red-500" },
};

// روزهای هفته به ترتیب تقویم ایرانی (شنبه تا جمعه)، مقدار = JS Date.getDay()
const WEEKDAYS = [
  { v: 6, l: "شنبه" }, { v: 0, l: "یکشنبه" }, { v: 1, l: "دوشنبه" },
  { v: 2, l: "سه‌شنبه" }, { v: 3, l: "چهارشنبه" }, { v: 4, l: "پنج‌شنبه" }, { v: 5, l: "جمعه" },
];

const BOOKING_WINDOWS = [
  { v: "DAILY", l: "روزانه (فقط امروز)" },
  { v: "WEEKLY", l: "هفتگی (۷ روز آینده)" },
  { v: "MONTHLY", l: "ماهانه (۳۰ روز آینده)" },
];

const EMPTY_SVC = {
  name: "", description: "", durationMins: 60, price: 0, isFree: false, color: "#F97316",
  bookingWindow: "WEEKLY", workDays: [6, 0, 1, 2, 3, 4], startTime: "09:00", endTime: "18:00", slotMinutes: 30,
};

export default function AppointmentsPage() {
  const [tab, setTab] = useState<"services" | "bookings" | "slots">("services");
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_SVC);
  const [saving, setSaving] = useState(false);

  const [slug, setSlug] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`${API}/api/v1/appointments/services`, { headers: auth() }),
        fetch(`${API}/api/v1/appointments/bookings`, { headers: auth() }),
      ]);
      const [sData, bData] = await Promise.all([sRes.json(), bRes.json()]);
      setServices(Array.isArray(sData?.data) ? sData.data : Array.isArray(sData) ? sData : []);
      setBookings(Array.isArray(bData?.data) ? bData.data : Array.isArray(bData) ? bData : []);
    } catch { setServices([]); setBookings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fetch(`${API}/api/v1/me/shop`, { headers: auth() }).then((r) => r.json())
      .then((d) => setSlug((d?.data ?? d)?.slug || "")).catch(() => {});
  }, []);

  const toggleWorkDay = (v: number) => {
    setForm((p: any) => ({
      ...p,
      workDays: p.workDays.includes(v) ? p.workDays.filter((x: number) => x !== v) : [...p.workDays, v],
    }));
  };

  const save = async () => {
    if (!form.name) { toast.error("نام سرویس الزامی است"); return; }
    if (!form.workDays.length) { toast.error("حداقل یک روز کاری انتخاب کنید"); return; }
    if (form.startTime >= form.endTime) { toast.error("ساعت پایان باید بعد از ساعت شروع باشد"); return; }
    setSaving(true);
    try {
      const body = { ...form, price: form.isFree ? 0 : Number(form.price) };
      const url = editing ? `${API}/api/v1/appointments/services/${editing.id}` : `${API}/api/v1/appointments/services`;
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || "خطا در ذخیره");
      toast.success(editing ? "ویرایش شد" : "سرویس اضافه شد");
      setShowForm(false);
      load();
    } catch (e: any) { toast.error(e.message || "خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const removeSvc = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await fetch(`${API}/api/v1/appointments/services/${id}`, { method: "DELETE", headers: auth() });
    setServices((p) => p.filter((x) => x.id !== id));
    toast.success("حذف شد");
  };

  const updateBooking = async (id: string, status: string) => {
    try {
      await fetch(`${API}/api/v1/appointments/bookings/${id}`, {
        method: "PUT",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setBookings((p) => p.map((b) => b.id === id ? { ...b, status } : b));
      toast.success("وضعیت بروز شد");
    } catch { toast.error("خطا"); }
  };

  const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#EF4444"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">نوبت‌دهی آنلاین</h1>
          <p className="text-sm text-gray-500">لینک رزرو را برای مشتری بفرستید تا آنلاین نوبت بگیرد</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {slug && <ShareBar url={`https://weeelink.ir/${slug}/booking`} text="رزرو نوبت آنلاین" />}
          {tab === "services" && (
            <button onClick={() => { setForm(EMPTY_SVC); setEditing(null); setShowForm(true); }}
              className="btn-primary flex items-center gap-2 py-2.5 px-4">
              <Plus className="w-4 h-4" /> افزودن سرویس
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
        {(["services", "bookings", "slots"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${tab === t
              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-medium"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            {t === "services" ? `سرویس‌ها (${services.length})` : t === "bookings" ? `رزروها (${bookings.length})` : "نمای زمان‌ها"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : tab === "services" ? (
        services.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <CalendarCheck className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500">هنوز سرویسی تعریف نکرده‌اید</p>
            <button onClick={() => { setForm(EMPTY_SVC); setEditing(null); setShowForm(true); }}
              className="btn-primary py-2 px-4 text-sm mx-auto flex items-center gap-2 w-fit">
              <Plus className="w-4 h-4" /> تعریف اولین سرویس
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="glass-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}20`, color: s.color }}>
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{s.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />{s.durationMins} دقیقه • اسلات {s.slotMinutes || 30} د
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setForm({ ...EMPTY_SVC, ...s }); setEditing(s); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeSvc(s.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                <div className="flex flex-wrap gap-1">
                  {(s.workDays || []).map((wd: number) => (
                    <span key={wd} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500">
                      {WEEKDAYS.find((w) => w.v === wd)?.l}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400" dir="ltr">{s.startTime}–{s.endTime}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                  <span className="font-black text-accent text-sm">
                    {s.isFree ? "رایگان" : formatPrice(s.price)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {s._count?.appointments || 0} رزرو
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === "bookings" ? (
        bookings.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-3">
            <CalendarCheck className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500">هنوز رزروی ثبت نشده</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const st = STATUS_LABELS[b.status] || STATUS_LABELS.PENDING;
              return (
                <div key={b.id} className="glass-card p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{b.customerName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{b.service?.name} • {b.customerPhone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(b.date).toLocaleDateString("fa-IR")} — {new Date(b.date).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {b.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button onClick={() => updateBooking(b.id, "CONFIRMED")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all">
                        <CheckCircle className="w-3.5 h-3.5" /> تأیید
                      </button>
                      <button onClick={() => updateBooking(b.id, "CANCELLED")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                        <XCircle className="w-3.5 h-3.5" /> رد
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <SlotsView services={services} />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? "ویرایش سرویس" : "افزودن سرویس"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">نام سرویس *</label>
                <input value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))}
                  className="input-base" placeholder="مثال: مشاوره تخصصی" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">توضیح</label>
                <textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  className="input-base resize-none h-16" placeholder="توضیح کوتاه..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">مدت ویزیت (دقیقه)</label>
                  <input type="number" value={form.durationMins}
                    onChange={(e) => setForm((p: any) => ({ ...p, durationMins: Number(e.target.value) }))}
                    className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رنگ</label>
                  <div className="flex gap-1.5 flex-wrap pt-2">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((p: any) => ({ ...p, color: c }))}
                        style={{ background: c }}
                        className={`w-6 h-6 rounded-full border-2 ${form.color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"} transition-all`} />
                    ))}
                  </div>
                </div>
              </div>

              {/* ─── زمان‌بندی نوبت‌دهی ─── */}
              <div className="rounded-xl border border-gray-200 dark:border-white/10 p-3 space-y-3">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">زمان‌بندی نوبت‌دهی</p>

                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5">بازهٔ باز بودن رزرو برای مشتری</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {BOOKING_WINDOWS.map((w) => (
                      <button key={w.v} type="button" onClick={() => setForm((p: any) => ({ ...p, bookingWindow: w.v }))}
                        className={`text-xs px-3 py-2 rounded-lg border text-right transition-all
                                    ${form.bookingWindow === w.v ? "bg-orange-500/15 border-orange-500/50 text-orange-500" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>
                        {w.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5">روزهای کاری</label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAYS.map((w) => (
                      <button key={w.v} type="button" onClick={() => toggleWorkDay(w.v)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all
                                    ${form.workDays.includes(w.v) ? "bg-orange-500/15 border-orange-500/50 text-orange-500" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>
                        {w.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1.5">ساعت شروع</label>
                    <input type="time" value={form.startTime} step={60} dir="ltr"
                      onChange={(e) => setForm((p: any) => ({ ...p, startTime: e.target.value }))}
                      className="input-base text-center" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-500 mb-1.5">ساعت پایان</label>
                    <input type="time" value={form.endTime} step={60} dir="ltr"
                      onChange={(e) => setForm((p: any) => ({ ...p, endTime: e.target.value }))}
                      className="input-base text-center" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-500 mb-1.5">فاصلهٔ هر نوبت</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[15, 30, 60].map((m) => (
                      <button key={m} type="button" onClick={() => setForm((p: any) => ({ ...p, slotMinutes: m }))}
                        className={`text-xs py-2 rounded-lg border transition-all
                                    ${form.slotMinutes === m ? "bg-orange-500/15 border-orange-500/50 text-orange-500" : "border-gray-200 dark:border-white/10 text-gray-500"}`}>
                        {m} دقیقه
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree}
                  onChange={(e) => setForm((p: any) => ({ ...p, isFree: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">رایگان</span>
              </label>
              {!form.isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">قیمت (تومان)</label>
                  <input type="number" value={form.price}
                    onChange={(e) => setForm((p: any) => ({ ...p, price: e.target.value }))}
                    className="input-base" placeholder="50000" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">
                  لغو
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── نمای زمان‌ها: گرید اسلات‌های یک روز برای یک سرویس، با تازه‌سازی نزدیک‌به‌بی‌درنگ ───
function SlotsView({ services }: { services: any[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (services.length && !serviceId) setServiceId(services[0].id); }, [services]);

  const fetchSlots = useCallback(async () => {
    if (!serviceId || !date) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/appointments/services/${serviceId}/slots?date=${date}`, { headers: auth() });
      const d = await r.json();
      setSlots((d?.data ?? d)?.slots || []);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  }, [serviceId, date]);

  useEffect(() => {
    fetchSlots();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchSlots, 8000); // real-time-ish: هر ۸ ثانیه تازه می‌شود
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchSlots]);

  if (services.length === 0) {
    return <div className="glass-card p-12 text-center text-gray-500">اول یک سرویس تعریف کنید</div>;
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
          className="input-base text-sm w-auto bg-white dark:bg-[#1a1a2e] text-gray-900 dark:text-white">
          {services.map((s) => <option key={s.id} value={s.id} className="bg-white dark:bg-[#1a1a2e]">{s.name}</option>)}
        </select>
        <JalaliDatePicker value={date} onChange={setDate} className="!w-auto" />
        <button onClick={fetchSlots} className="mr-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
        <span className="text-[11px] text-gray-400">به‌روزرسانی خودکار هر ۸ ثانیه</span>
      </div>

      {slots.length === 0 ? (
        <div className="glass-card p-10 text-center text-gray-400 text-sm">در این روز نوبتی تعریف نشده (روز کاری نیست یا خارج از بازهٔ رزرو است)</div>
      ) : (
        <div className="glass-card p-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {slots.map((s) => (
            <div key={s.time}
              title={s.booking ? `${s.booking.customerName} — ${s.booking.customerPhone}` : ""}
              className={`rounded-xl px-2 py-3 text-center border text-xs
                          ${s.booking
                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                            : s.available
                              ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                              : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400"}`}>
              <div className="font-mono font-bold" dir="ltr">{s.time}</div>
              <div className="mt-0.5 truncate">{s.booking ? s.booking.customerName : s.available ? "آزاد" : "گذشته"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
