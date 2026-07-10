"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, BookOpen, X, PlayCircle, Users, Lock, Unlock, ChevronDown, Upload, Video, Shield } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { ShareBar } from "@/components/ShareBar";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";

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
  const [newChapter, setNewChapter] = useState({ title: "", isPreview: false });
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // chapter video management
  const [expandedCh, setExpandedCh] = useState<string | null>(null);
  const [vidUploading, setVidUploading] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);
  const [videoForm, setVideoForm] = useState<{ title: string; videoUrl: string; coverUrl: string }>({ title: "", videoUrl: "", coverUrl: "" });
  const [wm, setWm] = useState({ watermarkText: "", watermarkColor: "#ffffff", watermarkCount: 3 });
  const [wmSaving, setWmSaving] = useState(false);
  const MAX_VIDEO = 1024 * 1024 * 1024; // 1GB

  // آپلود با درصد پیشرفت (XHR)
  const uploadXHR = (file: File, endpoint: string, onProgress: (p: number) => void) =>
    new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/api/v1/${endpoint}`);
      xhr.setRequestHeader("Authorization", auth().Authorization);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        try {
          const d = JSON.parse(xhr.responseText || "{}");
          if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(d.message || "خطا در آپلود"));
          resolve(d.data?.url || d.url);
        } catch { reject(new Error("خطا در آپلود")); }
      };
      xhr.onerror = () => reject(new Error("خطا در آپلود"));
      const fd = new FormData(); fd.append("file", file); xhr.send(fd);
    });

  const saveChapterVideos = async (chapterId: string, videos: any[]) => {
    const r = await fetch(`${API}/api/v1/courses/chapters/${chapterId}`, {
      method: "PUT", headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ videos }),
    });
    if (!r.ok) throw new Error();
    setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, videos } : c)));
  };

  const uploadChapterVideo = async (chapterId: string, file: File) => {
    if (file.size > MAX_VIDEO) { toast.error("حجم ویدیو نباید بیشتر از ۱ گیگابایت باشد"); return; }
    setVidUploading(true); setVidProgress(0);
    try {
      const url = await uploadXHR(file, "upload/video", setVidProgress);
      setVideoForm((p) => ({ ...p, videoUrl: url, title: p.title || file.name.replace(/\.[^.]+$/, "") }));
      toast.success("ویدیو آپلود شد");
    } catch (e: any) { toast.error(e.message || "خطا در آپلود ویدیو"); }
    finally { setVidUploading(false); }
  };

  const uploadVideoCover = async (file: File) => {
    try {
      const url = await uploadXHR(file, "upload/image", () => {});
      setVideoForm((p) => ({ ...p, coverUrl: url }));
    } catch { toast.error("خطا در آپلود کاور"); }
  };

  const addVideo = async (chapter: any) => {
    if (!videoForm.title || !videoForm.videoUrl) { toast.error("عنوان و ویدیو الزامی است"); return; }
    const videos = [...(chapter.videos || []), { ...videoForm }];
    try {
      await saveChapterVideos(chapter.id, videos);
      setVideoForm({ title: "", videoUrl: "", coverUrl: "" });
      toast.success("ویدیو اضافه شد");
    } catch { toast.error("خطا در ذخیره ویدیو"); }
  };

  const removeVideo = async (chapter: any, idx: number) => {
    const videos = (chapter.videos || []).filter((_: any, i: number) => i !== idx);
    try { await saveChapterVideos(chapter.id, videos); } catch { toast.error("خطا"); }
  };

  const saveWatermark = async () => {
    if (!selected) return;
    setWmSaving(true);
    try {
      const r = await fetch(`${API}/api/v1/courses/${selected.id}`, {
        method: "PUT", headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ watermarkText: wm.watermarkText, watermarkColor: wm.watermarkColor, watermarkCount: Number(wm.watermarkCount) }),
      });
      if (!r.ok) throw new Error();
      toast.success("تنظیمات واترمارک ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setWmSaving(false); }
  };

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

  const [slug, setSlug] = useState("");
  useEffect(() => {
    load();
    fetch(`${API}/api/v1/me/shop`, { headers: auth() }).then((r) => r.json())
      .then((d) => setSlug((d?.data ?? d)?.slug || "")).catch(() => {});
  }, []);
  useEffect(() => {
    if (selected) {
      loadChapters(selected.id);
      setWm({
        watermarkText: selected.watermarkText || "",
        watermarkColor: selected.watermarkColor || "#ffffff",
        watermarkCount: selected.watermarkCount ?? 3,
      });
      setExpandedCh(null);
    }
  }, [selected]);

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
        body: JSON.stringify({ ...newChapter, videos: [], sortOrder: chapters.length }),
      });
      const d = await r.json();
      setChapters((p) => [...p, d.data || d]);
      setNewChapter({ title: "", isPreview: false });
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-accent-500 transition-colors">
          ← بازگشت
        </button>
        <h1 className="text-xl font-black text-gray-900 dark:text-white flex-1">{selected.title}</h1>
        {slug && <ShareBar url={`https://weeelink.ir/${slug}/course/${selected.id}`} text={selected.title} />}
      </div>

      {/* فصل‌ها (آکاردیون) */}
      <div className="glass-card p-5 space-y-3">
        <h2 className="font-bold text-gray-900 dark:text-white">فصل‌ها و ویدیوها</h2>
        <div className="space-y-2">
          {chapters.map((ch, i) => {
            const open = expandedCh === ch.id;
            const vids = ch.videos || [];
            return (
              <div key={ch.id} className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 cursor-pointer"
                  onClick={() => { setExpandedCh(open ? null : ch.id); setVideoForm({ title: "", videoUrl: "", coverUrl: "" }); }}>
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{ch.title}</span>
                  <span className="text-[10px] text-gray-400">{vids.length} ویدیو</span>
                  {ch.isPreview ? <Unlock className="w-3.5 h-3.5 text-green-500" /> : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                  <button onClick={(e) => { e.stopPropagation(); removeChapter(ch.id); }} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>

                {open && (
                  <div className="p-3 space-y-3 bg-gray-100 dark:bg-transparent">
                    {/* لیست ویدیوها با پیش‌نمایش کوچک */}
                    {vids.map((v: any, vi: number) => (
                      <div key={vi} className="flex gap-3 items-start p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                        <video src={v.videoUrl} poster={v.coverUrl} className="w-24 h-16 object-cover rounded-lg bg-black shrink-0" preload="metadata" muted />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate">{v.title}</p>
                          <a href={v.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 truncate block" dir="ltr">{v.videoUrl.split("/").pop()}</a>
                        </div>
                        <button onClick={() => removeVideo(ch, vi)} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}

                    {/* افزودن ویدیو */}
                    <div className="border border-dashed border-gray-200 dark:border-white/10 rounded-lg p-3 space-y-2">
                      <input value={videoForm.title} onChange={(e) => setVideoForm((p) => ({ ...p, title: e.target.value }))}
                        className="input-base text-sm" placeholder="عنوان ویدیو" />
                      {videoForm.videoUrl ? (
                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                          <Video className="w-3.5 h-3.5" /><span className="truncate flex-1" dir="ltr">{videoForm.videoUrl.split("/").pop()}</span>
                          <button onClick={() => setVideoForm((p) => ({ ...p, videoUrl: "" }))} className="text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : vidUploading ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-accent-500"><span>در حال آپلود…</span><span>{vidProgress}٪</span></div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden"><div className="h-full bg-accent-500 transition-all" style={{ width: `${vidProgress}%` }} /></div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-gray-200 dark:border-white/10 text-xs text-gray-500 cursor-pointer hover:border-accent-500/40">
                            <Upload className="w-3.5 h-3.5" /> آپلود ویدیو (تا ۱GB)
                            <input type="file" accept="video/*" className="hidden"
                              onChange={(e) => e.target.files?.[0] && uploadChapterVideo(ch.id, e.target.files[0])} />
                          </label>
                        </div>
                      )}
                      {/* باکس مشخص برای کاور ویدیو — قبلاً یک لینک متنی کوچک بود و کاربر متوجه نمی‌شد */}
                      <div>
                        <label className={`flex flex-col items-center justify-center gap-1.5 w-full rounded-xl border-2 border-dashed p-3 cursor-pointer transition-colors ${
                          videoForm.coverUrl ? "border-green-500/40 bg-green-500/5" : "border-gray-200 dark:border-white/10 hover:border-accent-500/50"
                        }`}>
                          {videoForm.coverUrl ? (
                            <>
                              <img src={videoForm.coverUrl} alt="" className="w-full h-20 object-cover rounded-lg" />
                              <span className="text-[11px] text-green-500">کاور انتخاب شد — برای تغییر کلیک کنید</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500">آپلود کاور ویدیو (اختیاری)</span>
                            </>
                          )}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadVideoCover(e.target.files[0])} />
                        </label>
                        <p className="mt-1 text-[10px] text-gray-400 text-left">سایز مناسب: ۱۲۸۰×۷۲۰ پیکسل</p>
                      </div>
                      <button onClick={() => addVideo(ch)} className="btn-primary py-2 px-3 text-xs flex items-center gap-1.5 w-full justify-center">
                        <Plus className="w-3.5 h-3.5" /> افزودن این ویدیو
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* افزودن فصل */}
        <div className="border border-gray-200 dark:border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">افزودن فصل جدید</h3>
          <input value={newChapter.title} onChange={(e) => setNewChapter((p) => ({ ...p, title: e.target.value }))}
            className="input-base" placeholder="عنوان فصل" />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={newChapter.isPreview}
              onChange={(e) => setNewChapter((p) => ({ ...p, isPreview: e.target.checked }))}
              className="w-4 h-4 accent-accent-500" />
            نمایش رایگان (پیش‌نمایش)
          </label>
          <button onClick={addChapter} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> افزودن فصل
          </button>
        </div>
      </div>

      {/* واترمارک تنظیم‌شدنی حذف شد — ویدیوها خودکار با شماره موبایل خریدار واترمارک می‌شوند */}
      <div className="glass-card p-5 flex items-start gap-2">
        <Shield className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          محافظت کپی‌رایت خودکار است: شماره موبایل هر خریدار به‌صورت واترمارک متحرک روی ویدیوهای دوره نمایش داده می‌شود.
        </p>
      </div>

      {/* پیش‌نمایش امن (اولین ویدیو) */}
      {chapters.some((c) => (c.videos || []).length) && (
        <div className="glass-card p-5 space-y-2">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">پیش‌نمایش پخش‌کنندهٔ امن</h2>
          <SecureVideoPlayer
            src={(chapters.find((c) => (c.videos || []).length)?.videos[0]?.videoUrl) || ""}
            watermarkText="۰۹۱۲XXXXXXX (شماره خریدار)"
            watermarkColor="#ffffff"
            watermarkCount={3}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">دوره‌های آموزشی</h1>
          <p className="text-sm text-gray-500">دوره‌های آموزشی خود را بفروشید با دسترسی قفل‌شده</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {slug && <ShareBar url={`https://weeelink.ir/${slug}/courses`} text="دوره‌های آموزشی من" />}
          <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2 py-2.5 px-4">
            <Plus className="w-4 h-4" /> دوره جدید
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent-500" /></div>
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
                <div className="w-full h-36 bg-gradient-to-br from-accent-500/20 to-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-accent-400 opacity-60" />
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
                    className="flex-1 text-xs py-2 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20 hover:bg-accent-500/20 transition-all">
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
          <div className="bg-gray-100 dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                    className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl p-4 text-center text-sm text-gray-400 hover:border-accent-500/50 transition-colors">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "آپلود تصویر کاور"}
                  </button>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                <p className="mt-1 text-[10px] text-gray-400 text-left">سایز مناسب: ۱۲۸۰×۷۲۰ پیکسل</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree}
                  onChange={(e) => setForm((p: any) => ({ ...p, isFree: e.target.checked }))}
                  className="w-4 h-4 accent-accent-500" />
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
