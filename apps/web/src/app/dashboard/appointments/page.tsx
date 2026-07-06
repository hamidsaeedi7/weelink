"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, CalendarCheck, X, Clock, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ShareBar } from "@/components/ShareBar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "در انتظار",   color: "bg-yellow-500/20 text-yellow-500" },
  CONFIRMED: { label: "تأیید شده",  color: "bg-blue-500/20 text-blue-500" },
  DONE:      { label: "انجام شد",   color: "bg-green-500/20 text-green-500" },
  CANCELLED: { label: "لغو شده",    color: "bg-red-500/20 text-red-500" },
};

const EMPTY_SVC = { name: "", description: "", durationMins: 60, price: 0, isFree: false, color: "#F97316" };

export default function AppointmentsPage() {
  const [tab, setTab] = useState<"services" | "bookings">("services");
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

  const save = async () => {
    if (!form.name) { toast.error("نام سرویس الزامی است"); return; }
    setSaving(true);
    try {
      const body = { ...form, price: form.isFree ? 0 : Number(form.price) };
      const url = editing ? `${API}/api/v1/appointments/services/${editing.id}` : `${API}/api/v1/appointments/services`;
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      toast.success(editing ? "ویرایش شد" : "سرویس اضافه شد");
      setShowForm(false);
      load();
    } catch { toast.error("خطا در ذخیره"); }
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
        {(["services", "bookings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg transition-all ${tab === t
              ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-medium"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
            {t === "services" ? `سرویس‌ها (${services.length})` : `رزروها (${bookings.length})`}
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
                        <Clock className="w-3 h-3" />{s.durationMins} دقیقه
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setForm({ ...s }); setEditing(s); setShowForm(true); }}
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
      ) : (
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
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(b.date).toLocaleDateString("fa-IR")}</p>
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
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">مدت (دقیقه)</label>
                  <input type="number" value={form.durationMins}
                    onChange={(e) => setForm((p: any) => ({ ...p, durationMins: Number(e.target.value) }))}
                    className="input-base" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">رنگ</label>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setForm((p: any) => ({ ...p, color: c }))}
                        style={{ background: c }}
                        className={`w-6 h-6 rounded-full border-2 ${form.color === c ? "border-gray-900 dark:border-white scale-110" : "border-transparent"} transition-all`} />
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
