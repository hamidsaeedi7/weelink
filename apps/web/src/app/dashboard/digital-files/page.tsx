"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, FileDown, X, Download, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ShareBar } from "@/components/ShareBar";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const EMPTY = { title: "", description: "", price: 0, isFree: false, fileUrl: "", coverUrl: "", fileName: "" };

// پسوندهای مجاز فایل اصلی
const FILE_ACCEPT = ".zip,.rar,.esd,.ai,.jpeg,.jpg,.mp3,.fig,.figma,.pdf,.xlsx,.xls,.pptx,.ppt,.docx,.doc";

export default function DigitalFilesPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"file" | "cover" | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const MAX_FILE = 500 * 1024 * 1024; // 500MB

  const [slug, setSlug] = useState("");

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/digital-files`, { headers: auth() });
      const d = await r.json();
      setFiles(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    fetch(`${API}/api/v1/me/shop`, { headers: auth() }).then((r) => r.json())
      .then((d) => setSlug((d?.data ?? d)?.slug || "")).catch(() => {});
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (f: any) => { setForm({ ...f }); setEditing(f); setShowForm(true); };

  const uploadFile = (file: File, type: "file" | "cover") => {
    if (type === "file" && file.size > MAX_FILE) {
      toast.error("حجم فایل نباید بیشتر از ۵۰۰ مگابایت باشد");
      return;
    }
    setUploading(type);
    setProgress(0);
    // XHR (not fetch) so we can report real upload progress %
    const endpoint = type === "file" ? "upload/file" : "upload/image";
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/api/v1/${endpoint}`);
    xhr.setRequestHeader("Authorization", auth().Authorization);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(null);
      try {
        const d = JSON.parse(xhr.responseText || "{}");
        if (xhr.status < 200 || xhr.status >= 300) throw new Error(d.message || "خطا در آپلود");
        const url = d.data?.url || d.url;
        if (type === "file") {
          setForm((p: any) => ({ ...p, fileUrl: url, fileName: d.data?.originalName || file.name }));
        } else {
          setForm((p: any) => ({ ...p, coverUrl: url }));
        }
        toast.success("آپلود شد");
      } catch (e: any) { toast.error(e.message || "خطا در آپلود"); }
    };
    xhr.onerror = () => { setUploading(null); toast.error("خطا در آپلود — دوباره تلاش کنید"); };
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  };

  const save = async () => {
    if (!form.title || (!form.fileUrl && !editing)) { toast.error("عنوان و فایل الزامی است"); return; }
    setSaving(true);
    try {
      // Send only schema-backed fields (fileName is display-only; the
      // whitelist ValidationPipe would 400 on unknown props).
      const body = {
        title: form.title,
        description: form.description || "",
        fileUrl: form.fileUrl,
        coverUrl: form.coverUrl || "",
        isFree: !!form.isFree,
        price: form.isFree ? 0 : Number(form.price),
      };
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
          <p className="text-sm text-gray-500">لینک فروش را برای مشتری بفرستید یا در بیو نمایش دهید</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {slug && <ShareBar url={`https://weeelink.ir/${slug}/files`} text="فایل‌های دیجیتال من" />}
          <button onClick={openNew} className="btn-primary flex items-center gap-2 py-2.5 px-4">
            <Plus className="w-4 h-4" /> افزودن فایل
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
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
          <div className="bg-gray-100 dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  className="input-base" placeholder="مثال: فایل اکسل حسابداری" />
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
                    <span className="text-xs text-green-600 dark:text-green-400 truncate flex-1">{form.fileName || form.fileUrl.split("/").pop()}</span>
                    <button onClick={() => setForm((p: any) => ({ ...p, fileUrl: "", fileName: "" }))} className="text-gray-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : uploading === "file" ? (
                  <div className="w-full border-2 border-dashed border-accent-500/40 rounded-xl p-6 space-y-2">
                    <div className="flex items-center justify-between text-xs text-accent-500 font-bold">
                      <span>در حال آپلود...</span>
                      <span>{progress}٪</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-accent-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-6 text-center text-sm text-gray-400 hover:border-accent-500/50 transition-colors">
                    کلیک کنید تا فایل آپلود کنید
                  </button>
                )}
                <input ref={fileRef} type="file" accept={FILE_ACCEPT} className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "file")} />
                <p className="mt-1.5 text-[10px] text-gray-400">فرمت‌های مجاز: zip, rar, pdf, ai, figma, mp3, jpeg, excel, word, powerpoint — حداکثر ۵۰۰ مگابایت</p>
                <p className="mt-1 text-[10px] text-amber-500">هر محصول فقط یک فایل می‌پذیرد — اگر چند فایل دارید، همه را در یک zip فشرده کنید و همان را آپلود کنید.</p>
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
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 text-center text-sm text-gray-400 hover:border-accent-500/50 transition-colors">
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
                    className="w-4 h-4 accent-accent-500" />
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
