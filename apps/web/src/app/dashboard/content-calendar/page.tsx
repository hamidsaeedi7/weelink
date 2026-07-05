"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, Plus, X, Bell, Loader2,
  Send, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import {
  toJalali, toGregorian, jalaliMonthDays, jalaliMonthStart,
  JALALI_MONTHS, WEEK_DAYS, todayJalali, toPersianNum, isSameDay,
} from "@/lib/jalali";
import { BrandLogo, PLATFORM_META } from "@/components/blocks/brand-icons";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ContentPlan {
  id: string;
  title: string;
  description?: string;
  platform: string;
  contentType: string;
  scheduledAt: string;
  status: string;
  color: string;
  notifyBefore: number[];
  notifyViaSms: boolean;
  notifyViaEmail: boolean;
  notifyViaTelegram: boolean;
}

interface FormData {
  title: string;
  description: string;
  platform: string;
  contentType: string;
  scheduledAt: string;
  color: string;
  notifyBefore: number[];
  notifyViaSms: boolean;
  notifyViaEmail: boolean;
  notifyViaTelegram: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PLATFORMS = [
  { value: "instagram", label: "اینستاگرام", color: PLATFORM_META.instagram.color },
  { value: "youtube", label: "یوتیوب", color: PLATFORM_META.youtube.color },
  { value: "aparat", label: "آپارات", color: PLATFORM_META.aparat.color },
  { value: "telegram", label: "تلگرام", color: PLATFORM_META.telegram.color },
  { value: "bale", label: "بله", color: PLATFORM_META.bale.color },
  { value: "rubika", label: "روبیکا", color: PLATFORM_META.rubika.color },
  { value: "eitaa", label: "ایتا", color: PLATFORM_META.eitaa.color },
];

// نوع محتوا وابسته به پلتفرم
const CONTENT_TYPES: Record<string, string[]> = {
  instagram: ["post", "story", "reel"],
  youtube: ["video", "short"],
  aparat: ["video", "short"],
  telegram: ["channel_post"],
  bale: ["channel_post"],
  rubika: ["channel_post"],
  eitaa: ["channel_post"],
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: "پست", story: "استوری", reel: "ریلز",
  video: "ویدیو", short: "شورت ویدیو", channel_post: "پست کانال",
};

const COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#F59E0B", "#EC4899"];

const NOTIFY_OPTIONS = [
  { value: 1, label: "۱ ساعت قبل" },
  { value: 2, label: "۲ ساعت قبل" },
  { value: 6, label: "۶ ساعت قبل" },
  { value: 24, label: "۱ روز قبل" },
  { value: 48, label: "۲ روز قبل" },
  { value: 168, label: "۱ هفته قبل" },
];

const STATUS_ICONS: Record<string, JSX.Element> = {
  PLANNED: <Clock className="w-3 h-3 text-blue-400" />,
  DONE: <CheckCircle2 className="w-3 h-3 text-green-400" />,
  CANCELLED: <XCircle className="w-3 h-3 text-red-400" />,
};

// ─── API ─────────────────────────────────────────────────────────────────────
const API = "/api/v1/content-plans";
const token = () => typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : "";
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

async function apiFetch(url: string, opts?: RequestInit) {
  const r = await fetch(url, { ...opts, headers: headers() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContentCalendarPage() {
  const today = todayJalali();
  const [jy, setJy] = useState(today.jy);
  const [jm, setJm] = useState(today.jm);
  const [view, setView] = useState<"month" | "quarter" | "halfyear" | "year">("month");
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ jy: number; jm: number; jd: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<ContentPlan | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<{ connected?: boolean; chatId?: string } | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`${API}?year=${jy}&month=${jm}&view=${view}`);
      setPlans(data);
    } catch { setPlans([]); }
    setLoading(false);
  }, [jy, jm, view]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  useEffect(() => {
    apiFetch(`${API}/telegram/status`)
      .then(setTelegramStatus)
      .catch(() => {});
  }, []);

  const plansOnDay = (jy2: number, jm2: number, jd: number) => {
    const gDate = toGregorian(jy2, jm2, jd);
    return plans.filter((p) => isSameDay(new Date(p.scheduledAt), gDate));
  };

  const prevMonth = () => {
    if (jm === 1) { setJy(jy - 1); setJm(12); }
    else setJm(jm - 1);
  };
  const nextMonth = () => {
    if (jm === 12) { setJy(jy + 1); setJm(1); }
    else setJm(jm + 1);
  };

  const openAdd = (jy2: number, jm2: number, jd: number) => {
    setSelected({ jy: jy2, jm: jm2, jd });
    setEditPlan(null);
    setShowModal(true);
  };

  const openEdit = (plan: ContentPlan) => {
    setEditPlan(plan);
    setSelected(null);
    setShowModal(true);
  };

  const handleSaved = () => { setShowModal(false); fetchPlans(); };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiFetch(`${API}/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      fetchPlans();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف این محتوا؟")) return;
    try {
      await apiFetch(`${API}/${id}`, { method: "DELETE" });
      fetchPlans();
    } catch {}
  };

  // Determine months to show
  const monthsToShow = view === "month" ? 1 : view === "quarter" ? 3 : view === "halfyear" ? 6 : 12;
  const monthsList: { jy: number; jm: number }[] = [];
  for (let i = 0; i < monthsToShow; i++) {
    const m = ((jm - 1 + i) % 12) + 1;
    const y = jy + Math.floor((jm - 1 + i) / 12);
    monthsList.push({ jy: y, jm: m });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">تقویم محتوایی</h1>
          <p className="text-sm text-gray-500 mt-1">برنامه‌ریزی و زمان‌بندی محتوای شبکه‌های اجتماعی</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Telegram bot */}
          <TelegramConnect
            connected={!!telegramStatus?.connected}
            onChanged={() => apiFetch(`${API}/telegram/status`).then(setTelegramStatus).catch(() => {})}
          />
          <button
            onClick={() => { setSelected(today); setEditPlan(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl transition-all">
            <Plus className="w-4 h-4" /> محتوا جدید
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold min-w-[140px] text-center">
            {JALALI_MONTHS[jm - 1]} {toPersianNum(jy)}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex bg-white/5 rounded-lg p-0.5 text-xs">
          {[
            { v: "month", l: "ماهانه" },
            { v: "quarter", l: "فصلی" },
            { v: "halfyear", l: "نیم‌سال" },
            { v: "year", l: "سالانه" },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setView(v as any)}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${view === v ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>

        <div className="mr-auto text-xs text-gray-500">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${plans.length} محتوا`}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`grid gap-4 ${monthsToShow > 1 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
        {monthsList.map(({ jy: my, jm: mm }) => (
          <MonthGrid key={`${my}-${mm}`}
            jy={my} jm={mm}
            today={today}
            plansOnDay={plansOnDay}
            onAddDay={openAdd}
            onEditPlan={openEdit}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            compact={monthsToShow > 1}
          />
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <PlanModal
          selected={selected}
          editPlan={editPlan}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

// ─── Month Grid ───────────────────────────────────────────────────────────────
function MonthGrid({
  jy, jm, today, plansOnDay, onAddDay, onEditPlan, onStatusChange, onDelete, compact
}: {
  jy: number; jm: number;
  today: { jy: number; jm: number; jd: number };
  plansOnDay: (jy: number, jm: number, jd: number) => ContentPlan[];
  onAddDay: (jy: number, jm: number, jd: number) => void;
  onEditPlan: (plan: ContentPlan) => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  compact: boolean;
}) {
  const days = jalaliMonthDays(jy, jm);
  const startDay = jalaliMonthStart(jy, jm);
  const cells: (number | null)[] = [...Array(startDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Month header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <span className="font-bold text-sm">{JALALI_MONTHS[jm - 1]} {toPersianNum(jy)}</span>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-600 py-2 border-b border-white/[0.04]">
        {WEEK_DAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="aspect-square" />;
          const isToday = today.jy === jy && today.jm === jm && today.jd === day;
          const dayPlans = plansOnDay(jy, jm, day);
          const isFriday = (i % 7) === 6;

          return (
            <div key={day}
              className={`aspect-square p-0.5 border border-transparent hover:border-orange-500/20
                         cursor-pointer group relative ${isFriday ? "text-orange-400" : ""}`}
              onClick={() => onAddDay(jy, jm, day)}>
              <div className={`w-full h-full rounded-lg flex flex-col p-1 transition-colors
                              group-hover:bg-white/5 ${isToday ? "bg-orange-500/10 border !border-orange-500/30" : ""}`}>
                <span className={`text-xs font-medium leading-none mb-0.5
                                  ${isToday ? "text-orange-400" : "text-gray-400"}`}>
                  {toPersianNum(day)}
                </span>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayPlans.slice(0, compact ? 1 : 2).map((p) => (
                    <div key={p.id}
                      className="rounded text-[9px] font-medium px-1 truncate leading-tight py-0.5"
                      style={{ backgroundColor: p.color + "30", color: p.color }}
                      onClick={(e) => { e.stopPropagation(); onEditPlan(p); }}>
                      {p.title}
                    </div>
                  ))}
                  {dayPlans.length > (compact ? 1 : 2) && (
                    <div className="text-[9px] text-gray-500 text-center">
                      +{toPersianNum(dayPlans.length - (compact ? 1 : 2))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Plan Modal ───────────────────────────────────────────────────────────────
function PlanModal({
  selected, editPlan, onClose, onSaved,
}: {
  selected: { jy: number; jm: number; jd: number } | null;
  editPlan: ContentPlan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = todayJalali();
  const defaultDate = selected || today;

  const initScheduled = editPlan
    ? (() => {
        const d = new Date(editPlan.scheduledAt);
        const j = toJalali(d);
        return {
          jy: j.jy, jm: j.jm, jd: j.jd,
          time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        };
      })()
    : { ...defaultDate, time: "12:00" };

  const [form, setForm] = useState<FormData>({
    title: editPlan?.title ?? "",
    description: editPlan?.description ?? "",
    platform: editPlan?.platform ?? "instagram",
    contentType: editPlan?.contentType ?? "post",
    scheduledAt: "",
    color: editPlan?.color ?? "#F97316",
    notifyBefore: editPlan?.notifyBefore ?? [24],
    notifyViaSms: editPlan?.notifyViaSms ?? false,
    notifyViaEmail: editPlan?.notifyViaEmail ?? false,
    notifyViaTelegram: editPlan?.notifyViaTelegram ?? false,
  });
  const [jDate, setJDate] = useState(initScheduled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleNotifyBefore = (v: number) => {
    setForm((f) => ({
      ...f,
      notifyBefore: f.notifyBefore.includes(v)
        ? f.notifyBefore.filter((x) => x !== v)
        : [...f.notifyBefore, v],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const gDate = toGregorian(jDate.jy, jDate.jm, jDate.jd);
      const [h, mi] = jDate.time.split(":").map(Number);
      gDate.setHours(h, mi, 0, 0);

      // Send only the fields the API expects (channels are handled server-side).
      const body = {
        title: form.title,
        description: form.description,
        platform: form.platform,
        contentType: form.contentType,
        color: form.color,
        notifyBefore: form.notifyBefore,
        scheduledAt: gDate.toISOString(),
      };

      if (editPlan) {
        await apiFetch(`/api/v1/content-plans/${editPlan.id}`, {
          method: "PUT", body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/v1/content-plans", {
          method: "POST", body: JSON.stringify(body),
        });
      }
      onSaved();
    } catch (err: any) {
      // Surface the real API message (PRO required / max-6-per-day / ...).
      let msg = "خطا در ذخیره محتوا";
      try {
        const j = JSON.parse(err?.message || "{}");
        if (j?.code === "PRO_REQUIRED") msg = "تقویم محتوا مخصوص پلن پرو است";
        else if (j?.message) msg = Array.isArray(j.message) ? j.message[0] : j.message;
      } catch { /* keep default */ }
      setError(msg);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#141418] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="font-bold">{editPlan ? "ویرایش محتوا" : "محتوا جدید"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">عنوان محتوا *</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required placeholder="مثال: پست معرفی محصول جدید"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                         focus:outline-none focus:border-orange-500/50 transition-all" />
          </div>

          {/* Platform (logo buttons) */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">پلتفرم</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map((p) => {
                const active = form.platform === p.value;
                return (
                  <button key={p.value} type="button"
                    onClick={() => setForm((f) => ({ ...f, platform: p.value, contentType: CONTENT_TYPES[p.value][0] }))}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all
                                ${active ? "border-orange-500/60 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                    <BrandLogo platform={p.value} size={22} />
                    <span className="text-[10px] text-gray-300">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content type */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">نوع محتوا</label>
            <div className="flex flex-wrap gap-2">
              {(CONTENT_TYPES[form.platform] || []).map((t) => (
                <button key={t} type="button"
                  onClick={() => setForm((f) => ({ ...f, contentType: t }))}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                              ${form.contentType === t
                                ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                : "border-white/10 text-gray-400 hover:border-white/20"}`}>
                  {CONTENT_TYPE_LABELS[t] || t}
                </button>
              ))}
            </div>
          </div>

          {/* Jalali Date + Time */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">تاریخ و ساعت (شمسی)</label>
            <div className="grid grid-cols-4 gap-2">
              <input type="number" min={1400} max={1420} value={jDate.jy}
                onChange={(e) => setJDate((d) => ({ ...d, jy: +e.target.value }))}
                placeholder="سال"
                className="px-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-center
                           focus:outline-none focus:border-orange-500/50 transition-all" />
              <select value={jDate.jm} onChange={(e) => setJDate((d) => ({ ...d, jm: +e.target.value }))}
                className="px-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                           focus:outline-none focus:border-orange-500/50 transition-all">
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{JALALI_MONTHS[i]}</option>
                ))}
              </select>
              <input type="number" min={1} max={31} value={jDate.jd}
                onChange={(e) => setJDate((d) => ({ ...d, jd: +e.target.value }))}
                placeholder="روز"
                className="px-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-center
                           focus:outline-none focus:border-orange-500/50 transition-all" />
              <input type="time" value={jDate.time}
                onChange={(e) => setJDate((d) => ({ ...d, time: e.target.value }))}
                className="px-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-center
                           focus:outline-none focus:border-orange-500/50 transition-all" dir="ltr" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">توضیحات (اختیاری)</label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="ایده‌ها، کپشن پیشنهادی، هشتگ‌ها..."
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm
                         focus:outline-none focus:border-orange-500/50 transition-all resize-none" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">رنگ در تقویم</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#141418] scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Bell className="w-4 h-4 text-orange-500" /> یادآوری
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">چه موقع یادآوری بفرستم؟</p>
              <div className="flex flex-wrap gap-2">
                {NOTIFY_OPTIONS.map(({ value, label }) => (
                  <button key={value} type="button"
                    onClick={() => toggleNotifyBefore(value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all
                                ${form.notifyBefore.includes(value)
                                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                  : "border-white/10 text-gray-500 hover:border-white/20"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              یادآوری از داخل داشبورد نمایش داده می‌شود؛ در صورت اتصال ربات تلگرام،
              یادآوری به تلگرام شما هم ارسال می‌شود.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-sm text-gray-400
                         hover:bg-white/5 transition-all">
              انصراف
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                         bg-orange-500 hover:bg-orange-400 disabled:opacity-60
                         text-white text-sm font-bold rounded-xl transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editPlan ? "ذخیره" : "افزودن")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Telegram Connect (user's own bot token + chat id) ────────────────────────
function TelegramConnect({ connected, onChanged }: { connected: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setErr("");
    if (!botToken.trim() || !chatId.trim()) { setErr("توکن ربات و شناسه چت الزامی است"); return; }
    setSaving(true);
    try {
      await apiFetch("/api/v1/content-plans/telegram/set-token", {
        method: "POST",
        body: JSON.stringify({ botToken: botToken.trim(), chatId: chatId.trim() }),
      });
      setOpen(false); setBotToken(""); setChatId("");
      onChanged();
    } catch {
      setErr("ذخیره نشد، دوباره تلاش کنید");
    }
    setSaving(false);
  };

  const disconnect = async () => {
    try {
      await apiFetch("/api/v1/content-plans/telegram/disconnect", { method: "DELETE" });
      onChanged();
    } catch {}
  };

  return (
    <>
      {connected ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg">
            <Send className="w-3.5 h-3.5" /> ربات متصل
          </div>
          <button onClick={disconnect} className="text-xs text-gray-500 hover:text-red-400">قطع اتصال</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10
                     border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg transition-all">
          <Send className="w-3.5 h-3.5" /> اتصال ربات تلگرام
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}>
          <div className="bg-[#141418] border border-white/10 rounded-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">اتصال ربات تلگرام</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <ol className="text-[11px] text-gray-400 space-y-1.5 leading-relaxed list-decimal pr-4">
              <li>در تلگرام به <span className="text-blue-400">@BotFather</span> پیام دهید و یک ربات بسازید تا <b>توکن</b> بگیرید.</li>
              <li>به ربات <span className="text-blue-400">@userinfobot</span> پیام دهید تا <b>شناسه چت (Chat ID)</b> عددی خود را ببینید.</li>
              <li>یک‌بار به ربات خودتان <span className="text-white">/start</span> بزنید تا اجازهٔ ارسال پیام بدهید.</li>
            </ol>
            <div>
              <label className="block text-xs text-gray-400 mb-1">توکن ربات</label>
              <input value={botToken} onChange={(e) => setBotToken(e.target.value)} dir="ltr"
                placeholder="123456:ABC-DEF..." className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-left focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">شناسه چت (Chat ID)</label>
              <input value={chatId} onChange={(e) => setChatId(e.target.value)} dir="ltr"
                placeholder="123456789" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-left focus:outline-none focus:border-orange-500/50" />
            </div>
            {err && <p className="text-xs text-red-400">{err}</p>}
            <button onClick={save} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold rounded-xl disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "ذخیره و اتصال"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
