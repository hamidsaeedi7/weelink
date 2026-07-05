"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen, X, PlayCircle, Users, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const EMPTY = { title: "", description: "", price: 0, isFree: false, coverUrl: "" };

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [newChapter, setNewChapter] = useState({ title: "", videoUrl: "", isPreview: false });
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Always coerce to an array: an error response ({success:false,...}) has no
  // `data` array, and setting state to that object made `courses.map` crash the
  // whole page (white screen / application error).
  const asArray = (d: any) => (Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/courses`, { headers: auth() });
      const d = await r.json();
      setCourses(asArray(d));
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  const loadChapters = async (courseId: string) => {
    try {
      const r = await fetch(`${API}/api/v1/courses/${courseId}/chapters`, { headers: auth() });
      const d = await r.json();
      setChapters(asArray(d));
    } catch { setChapters([]); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadChapters(selected.id); }, [selected]);

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch(`${API}/api/v1/upload/image`, { method: "POST", headers: auth(), body: fd });
      const d = await r.json();
      setForm((p: any) => ({ ...p, coverUrl: d.data?.url || d.url }));
    } catch { toast.error("خطا در آپلود"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title) { toast.error("عنوان الزامی است"); return; }
    setSaving(true);
    try {
      const body = { ...form, price: form.isFree ? 0 : Number(form.price) };
      const url = editing ? `${API}/api/v1/courses/${editing.id}` : `${API}/api/v1/courses`;
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      toast.success(editing ? "ویرایش شد" : "دوره اضافه شد");
      setShowForm(false);
      load();
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const addChapter = async () => {
    if (!newChapter.title || !selected) return;
    try {
      const r = await fetch(`${API}/api/v1/courses/${selected.id}/chapters`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...newChapter, sortOrder: chapters.length }),
      });
      const d = await r.json();
      setChapters((p) => [...p, d.data || d]);
      setNewChapter({ title: "", videoUrl: "", isPreview: false });
      toast.success("فصل اضافه شد");
    } catch { toast.error("خطا"); }
  };

  const removeChapter = async (id: string) => {
    await fetch(`${API}/api/v1/courses/chapters/${id}`, { method: "DELETE", headers: auth() });
    setChapters((p) => p.filter((c) => c.id !== id));
  };

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await fetch(`${API}/api/v1/courses/${id}`, { method: "DELETE", headers: auth() });
    setCourses((p) => p.filter((c) => c.id !== id));
    toast.success("دوره حذف شد");
  };

  if (selected) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
          ← بازگشت
        </button>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">{selected.title}</h1>
      </div>
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">فصل‌های دوره</h2>
        <div className="space-y-2">
          {chapters.map((ch, i) => (
            <div key={ch.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
              <span className="text-xs text-gray-400 w-5">{i + 1}</span>
              <PlayCircle className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="flex-1 text-sm text-gray-900 dark:text-white">{ch.title}</span>
              {ch.isPreview ? <Unlock className="w-3.5 h-3.5 text-green-500" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
              <button onClick={() => removeChapter(ch.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">افزودن فصل جدید</h3>
          <input value={newChapter.title} onChange={(e) => setNewChapter((p) => ({ ...p, title: e.target.value }))}
            className="input-base" placeholder="عنوان فصل" />
          <input value={newChapter.videoUrl} onChange={(e) => setNewChapter((p) => ({ ...p, videoUrl: e.target.value }))}
            className="input-base" placeholder="لینک ویدیو (یوتیوب، آپارات...)" dir="ltr" />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={newChapter.isPreview}
              onChange={(e) => setNewChapter((p) => ({ ...p, isPreview: e.target.checked }))}
              className="w-4 h-4 accent-orange-500" />
            نمایش رایگان (پیش‌نمایش)
          </label>
          <button onClick={addChapter} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> افزودن فصل
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">دوره‌های آموزشی</h1>
          <p className="text-sm text-gray-500">دوره‌های آموزشی خود را بفروشید با دسترسی قفل‌شده</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 py-2.5 px-4">
          <Plus className="w-4 h-4" /> دوره جدید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">هنوز دوره‌ای اضافه نکرده‌اید</p>
          <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
            className="btn-primary py-2 px-4 text-sm mx-auto flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> دوره اول را بسازید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.id} className="glass-card overflow-hidden">
              {c.coverUrl ? (
                <img src={c.coverUrl} alt={c.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-orange-400 opacity-60" />
                </div>
              )}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white">{c.title}</h3>
                {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="font-black text-accent text-sm">{c.isFree ? "رایگان" : formatPrice(c.price)}</span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="w-3.5 h-3.5" />
                    {c._count?.enrollments || 0}
                  </div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
                  <button onClick={() => setSelected(c)}
                    className="flex-1 text-xs py-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                    مدیریت فصل‌ها
                  </button>
                  <button onClick={() => { setForm({ ...c }); setEditing(c); setShowForm(true); }}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(c.id)}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? "ویرایش دوره" : "دوره جدید"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان دوره *</label>
                <input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  className="input-base" placeholder="مثال: آموزش طراحی سایت از صفر" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">توضیح</label>
                <textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  className="input-base resize-none h-20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">کاور دوره</label>
                {form.coverUrl ? (
                  <div className="relative">
                    <img src={form.coverUrl} alt="" className="w-full h-28 object-cover rounded-xl" />
                    <button onClick={() => setForm((p: any) => ({ ...p, coverUrl: "" }))}
                      className="absolute top-2 left-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => coverRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 text-center text-sm text-gray-400 hover:border-orange-500/50 transition-colors">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "آپلود تصویر کاور"}
                  </button>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree}
                  onChange={(e) => setForm((p: any) => ({ ...p, isFree: e.target.checked }))}
                  className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">دوره رایگان</span>
              </label>
              {!form.isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">قیمت (تومان)</label>
                  <input type="number" value={form.price}
                    onChange={(e) => setForm((p: any) => ({ ...p, price: e.target.value }))}
                    className="input-base" placeholder="500000" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500">
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
