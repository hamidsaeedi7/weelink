"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileDown, BookOpen, Ban, CheckCircle2 } from "lucide-react";
import { adminApi, fmtPrice } from "@/lib/api";

interface DigitalFile {
  id: string;
  title: string;
  price: number;
  isFree: boolean;
  isActive: boolean;
  downloadCount: number;
  shop: { name: string; slug: string };
}

interface Course {
  id: string;
  title: string;
  price: number;
  isFree: boolean;
  isActive: boolean;
  shop: { name: string; slug: string };
  _count: { enrollments: number };
}

export default function DigitalContentPage() {
  const [tab, setTab] = useState<"files" | "courses">("files");
  const [files, setFiles] = useState<DigitalFile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, c] = await Promise.all([adminApi.getDigitalFilesAdmin(), adminApi.getCoursesAdmin()]);
      setFiles(f.files ?? []);
      setCourses(c.courses ?? []);
    } catch {
      toast.error("خطا در بارگذاری محتوا");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleFile = async (id: string) => {
    try {
      const updated = await adminApi.toggleDigitalFileActive(id);
      toast.success(updated.isActive ? "فایل فعال شد" : "فایل غیرفعال شد");
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, isActive: updated.isActive } : f)));
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const toggleCourse = async (id: string) => {
    try {
      const updated = await adminApi.toggleCourseActive(id);
      toast.success(updated.isActive ? "دوره فعال شد" : "دوره غیرفعال شد");
      setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: updated.isActive } : c)));
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">محتوای دیجیتال</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">نظارت بر فایل‌های دیجیتال و دوره‌های آموزشی کل پلتفرم</p>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {(["files", "courses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === t ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {t === "files" ? <><FileDown size={14} /> فایل‌های دیجیتال ({files.length})</> : <><BookOpen size={14} /> دوره‌ها ({courses.length})</>}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : tab === "files" ? (
          files.length === 0 ? (
            <div className="text-center py-16 text-gray-400">فایلی یافت نشد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عنوان</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">قیمت</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">دانلود</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {files.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{f.title}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{f.shop.name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{f.isFree ? "رایگان" : fmtPrice(f.price)}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{f.downloadCount.toLocaleString("fa-IR")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          f.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}>{f.isActive ? "فعال" : "غیرفعال"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFile(f.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                            f.isActive
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                          }`}
                        >
                          {f.isActive ? <><Ban size={13} /> غیرفعال کن</> : <><CheckCircle2 size={13} /> فعال کن</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">دوره‌ای یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عنوان</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">فروشگاه</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">قیمت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">ثبت‌نام</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.title}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.shop.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{c.isFree ? "رایگان" : fmtPrice(c.price)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c._count.enrollments.toLocaleString("fa-IR")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}>{c.isActive ? "فعال" : "غیرفعال"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleCourse(c.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          c.isActive
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        }`}
                      >
                        {c.isActive ? <><Ban size={13} /> غیرفعال کن</> : <><CheckCircle2 size={13} /> فعال کن</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
