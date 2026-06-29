"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, Globe, EyeOff } from "lucide-react";
import { adminApi, fmtDate } from "@/lib/api";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
}

export default function LandingPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "" });

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getLandingPages();
      setPages(data);
    } catch {
      toast.error("خطا در بارگذاری صفحات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      toast.error("عنوان و اسلاگ الزامی است");
      return;
    }
    try {
      setCreating(true);
      await adminApi.createLandingPage({ title: form.title, slug: form.slug, blocks: [], isPublished: false });
      toast.success("صفحه جدید ساخته شد");
      setForm({ title: "", slug: "" });
      setShowForm(false);
      load();
    } catch {
      toast.error("خطا در ساخت صفحه");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف صفحه "${title}" مطمئنید؟`)) return;
    try {
      await adminApi.deleteLandingPage(id);
      toast.success("صفحه حذف شد");
      load();
    } catch {
      toast.error("خطا در حذف صفحه");
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">صفحات لندینگ</h1>
          <p className="text-white/50 text-sm mt-1">مدیریت و ویرایش صفحات فرود</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle size={18} />
          صفحه جدید
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-5">
          <h2 className="text-white font-semibold mb-4">ایجاد صفحه جدید</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              className="input-base flex-1"
              placeholder="عنوان صفحه"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="input-base flex-1"
              placeholder="اسلاگ (مثال: pricing)"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.replace(/\s+/g, "-").toLowerCase() }))}
            />
            <button type="submit" disabled={creating} className="btn-primary whitespace-nowrap">
              {creating ? "در حال ساخت..." : "ایجاد صفحه"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition whitespace-nowrap"
            >
              انصراف
            </button>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-white/50">در حال بارگذاری...</div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/40 gap-2">
            <Globe size={36} />
            <p>هیچ صفحه‌ای یافت نشد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="text-right px-5 py-3 font-medium">عنوان</th>
                <th className="text-right px-5 py-3 font-medium">اسلاگ</th>
                <th className="text-right px-5 py-3 font-medium">وضعیت</th>
                <th className="text-right px-5 py-3 font-medium">تاریخ ساخت</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-4 text-white font-medium">{page.title}</td>
                  <td className="px-5 py-4">
                    <code className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded font-mono">/{page.slug}</code>
                  </td>
                  <td className="px-5 py-4">
                    {page.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                        <Globe size={12} /> منتشر شده
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-white/10 text-white/50 px-2 py-1 rounded-full">
                        <EyeOff size={12} /> پیش‌نویس
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-white/50">{fmtDate(page.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => router.push(`/modir/landing-pages/${page.id}`)}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                        title="ویرایش"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(page.id, page.title)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                        title="حذف"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
