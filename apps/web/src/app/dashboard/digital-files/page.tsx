"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, FileDown, X, Download, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const EMPTY = { title: "", description: "", price: 0, isFree: false, fileUrl: "", coverUrl: "" };

export default function DigitalFilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"file" | "cover" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/digital-files`, { headers: auth() });
      const d = await r.json();
      setFiles(d.data || d || []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (f: any) => { setForm({ ...f }); setEditing(f); setShowForm(true); };

  const uploadFile = async (file: File, type: "file" | "cover") => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API}/api/v1/upload/image`, { method: "POST", headers: auth(), body: fd });
      const d = await r.json();
      const url = d.data?.url || d.url;
      setForm((p: any) => ({ ...p, [type === "file" ? "fileUrl" : "coverUrl"]: url }));
      toast.success("آپلود شد");
    } catch { toast.error("خطا در آپلود"); }
    finally { setUploading(null); }
  };

  const save = async () => {
    if (!form.title || (!form.fileUrl && !editing)) { toast.error("عنوان و فایل الزامی است"); return; }
    setSaving(true);
    try {
      const body = { ...form, price: form.isFree ? 0 : Number(form.price) };
      const url = editing ? `${API}/api/v1/digital-files/${editing.id}` : `${API}/api/v1/digital-files`;
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      toast.success(editing ? "ویرایش شد" : "فایل اضافه شد");
      setShowForm(false);
      load();
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const toggle = async (f: any) => {
    try {
      await fetch(`${API}/api/v1/digital-files/${f.id}`, {
        method: "PUT",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      setFiles((p) => p.map((x) => x.id === f.id ? { ...x, isActive: !x.isActive } : x));
    } catch { toast.error("خطا"); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await fetch(`${API}/api/v1/digital-files/${id}`, { method: "DELETE", headers: auth() });
      setFiles((p) => p.filter((x) => x.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">فروش فایل دیجیتال</h1>
          <p className="text-sm text-gray-500">PDF، موسیقی، عکس، قالب — دانلود خودکار پس از پرداخت</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 py-2.5 px-4">
          <Plus className="w-4 h-4" /> افزودن فایل
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : files.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <FileDown className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">هنوز فایلی اضافه نکرده‌اید</p>
          <button onClick={openNew} className="btn-primary py-2 px-4 text-sm mx-auto flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> اولین فایل را اضافه کنید
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((f) => (
            <div key={f.id} className={`glass-card p-4 space-y-3 ${!f.isActive ? "opacity-60" : ""}`}>
              {f.coverUrl && (
                <img src={f.coverUrl} alt={f.title} className="w-full h-32 object-cover rounded-xl" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{f.title}</h3>
                  {f.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{f.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggle(f)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                    {f.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
                <span className="font-black text-accent text-sm">
                  {f.isFree ? "رایگان" : formatPrice(f.price)}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Download className="w-3.5 h-3.5" />
                  {f.downloadCount || 0} دانلود
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? "ویرایش فایل" : "افزودن فایل دیجیتال"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان فایل *</label>
                <input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  className="input-base" placeholder="مثال: پکیج طراحی لوگو" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">توضیح</label>
                <textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
                  className="input-base resize-none h-20" placeholder="درباره محتوای فایل توضیح دهید..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">فایل اصلی</label>
                {form.fileUrl ? (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <FileDown className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400 truncate flex-1">{form.fileUrl.split("/").pop()}</span>
                    <button onClick={() => setForm((p: any) => ({ ...p, fileUrl: "" }))} className="text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 text-center text-sm text-gray-400 hover:border-orange-500/50 transition-colors">
                    {uploading === "file" ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "کلیک کنید تا فایل آپلود کنید"}
                  </button>
                )}
                <input ref={fileRef} type="file" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "file")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">تصویر کاور (اختیاری)</label>
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
                    {uploading === "cover" ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "آپلود تصویر کاور"}
                  </button>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "cover")} />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFree}
                    onChange={(e) => setForm((p: any) => ({ ...p, isFree: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">رایگان (بدون پرداخت)</span>
                </label>
              </div>
              {!form.isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">قیمت (تومان)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((p: any) => ({ ...p, price: e.target.value }))}
                    className="input-base" placeholder="مثال: 50000" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">
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
