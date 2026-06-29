import * as jalaaliLib from "jalaali-js";
const jalaali = (jalaaliLib as any).default ?? jalaaliLib;

export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function jalaliMonthDays(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function jalaliMonthStart(jy: number, jm: number): number {
  const g = toGregorian(jy, jm, 1);
  // Saturday=0 in Persian week
  return (g.getDay() + 1) % 7;
}

export function formatJalali(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export function formatJalaliPersian(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return `${toPersianNum(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianNum(jy)}`;
}

export function toPersianNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
];

export const WEEK_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function todayJalali() {
  return toJalali(new Date());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
