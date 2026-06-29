import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toPersianNumber(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

export function formatPrice(amount: number): string {
  return toPersianNumber(amount.toLocaleString("fa-IR")) + " تومان";
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "همین الان";
  if (seconds < 3600) return `${toPersianNumber(Math.floor(seconds / 60))} دقیقه پیش`;
  if (seconds < 86400) return `${toPersianNumber(Math.floor(seconds / 3600))} ساعت پیش`;
  return `${toPersianNumber(Math.floor(seconds / 86400))} روز پیش`;
}
