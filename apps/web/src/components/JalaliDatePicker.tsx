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
