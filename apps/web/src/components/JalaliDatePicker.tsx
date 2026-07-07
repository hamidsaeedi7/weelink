"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface Props {
  /** ISO date string (Gregorian) or "" */
  value: string;
  /** returns an ISO date string (Gregorian) or "" */
  onChange: (iso: string) => void;
  placeholder?: string;
  withTime?: boolean;
  minToday?: boolean;
  className?: string;
}

// Persian (Jalali/Shamsi) date picker that stores a Gregorian ISO string,
// so the backend keeps receiving normal Date values.
export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  withTime = false,
  minToday = false,
  className = "",
}: Props) {
  return (
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={value ? new Date(value) : ""}
      onChange={(d: any) => {
        if (!d) return onChange("");
        const g: Date = typeof d.toDate === "function" ? d.toDate() : new Date(d);
        onChange(withTime ? g.toISOString() : g.toISOString().slice(0, 10));
      }}
      format={withTime ? "YYYY/MM/DD HH:mm" : "YYYY/MM/DD"}
      minDate={minToday ? new Date() : undefined}
      inputClass={`input-base ${className}`}
      placeholder={placeholder}
      calendarPosition="bottom-right"
      editable={false}
    />
  );
}

// تاریخ شمسی + ساعت ۲۴ساعته → یک رشتهٔ ISO کامل. value/onChange با ISO کار می‌کنند.
export function JalaliDateTime({
  value,
  onChange,
  minToday = false,
}: {
  value: string;
  onChange: (iso: string) => void;
  minToday?: boolean;
}) {
  const d = value ? new Date(value) : null;
  const datePart = d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
  const timePart =
    d && !isNaN(d.getTime())
      ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      : "23:59";

  const combine = (dateIso: string, time: string) => {
    if (!dateIso) return onChange("");
    onChange(new Date(`${dateIso}T${time || "23:59"}:00`).toISOString());
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <JalaliDatePicker
        value={datePart}
        onChange={(dateIso) => combine(dateIso, timePart)}
        placeholder="تاریخ (شمسی)"
        minToday={minToday}
      />
      <input
        type="time"
        value={timePart}
        onChange={(e) => combine(datePart || new Date().toISOString().slice(0, 10), e.target.value)}
        step={60}
        dir="ltr"
        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-accent-500/50"
      />
    </div>
  );
}
