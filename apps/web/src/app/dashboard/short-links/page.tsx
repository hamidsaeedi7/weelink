"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Scissors, Copy, Trash2, BarChart3, ExternalLink, X, Zap } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

export default function ShortLinksPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ originalUrl: "", title: "", shortCode: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/short-links`, { headers: auth() });
      if (r.status === 403) { setIsPro(false); setLoading(false); return; }
      const d = await r.json();
      setIsPro(true);
      setLinks(d.data || d || []);
    } catch { setLinks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.originalUrl) { toast.error("آدرس لینک الزامی است"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/v1/short-links`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast.success("لینک کوتاه ساخته شد");
      setShowForm(false);
      setForm({ originalUrl: "", title: "", shortCode: "" });
      load();
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/short-links/${id}`, { method: "DELETE", headers: auth() });
    setLinks((p) => p.filter((l) => l.id !== id));
    toast.success("حذف شد");
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/s/${code}`);
    toast.success("کپی شد");
  };

  if (!isPro && !loading) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">لینک کوتاه‌ساز</h1>
        <p className="text-sm text-gray-500">آمارگیری از کلیک‌ها با لینک‌های کوتاه برند شما</p>
      </div>
      <div className="glass-card p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">این ویژگی برای پلن Pro است</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">با ارتقا به پلن Pro می‌توانید لینک‌های کوتاه با آمار کلیک بسازید</p>
        <a href="/dashboard/plans" className="btn-primary py-2.5 px-6 inline-flex items-center gap-2">
          <Zap className="w-4 h-4" /> ارتقا به Pro
        </a>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">لینک کوتاه‌ساز</h1>
          <p className="text-sm text-gray-500">لینک‌های کوتاه با آمار کلیک</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 py-2.5 px-4">
          <Plus className="w-4 h-4" /> لینک جدید
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : links.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Scissors className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">هنوز لینک کوتاهی نساخته‌اید</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.id} className="glass-card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                {l.title && <p className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">{l.title}</p>}
                <div className="flex items-center gap-2">
                  <code className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-lg">
                    /s/{l.shortCode}
                  </code>
                  <span className="text-xs text-gray-400 truncate hidden sm:block">{l.originalUrl}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <BarChart3 className="w-3.5 h-3.5" />{l.clickCount} کلیک
                </div>
                <button onClick={() => copy(l.shortCode)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={l.originalUrl} target="_blank" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => remove(l.id)} className="p-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">لینک کوتاه جدید</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">آدرس اصلی *</label>
                <input value={form.originalUrl} onChange={(e) => setForm((p) => ({ ...p, originalUrl: e.target.value }))}
                  className="input-base" placeholder="https://example.com/very-long-url" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان (اختیاری)</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="input-base" placeholder="مثال: تبلیغ اینستاگرام" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">کد کوتاه (اختیاری)</label>
                <input value={form.shortCode} onChange={(e) => setForm((p) => ({ ...p, shortCode: e.target.value }))}
                  className="input-base" placeholder="مثال: insta24" dir="ltr" />
                <p className="text-xs text-gray-400 mt-1">اگر خالی بگذارید، به صورت خودکار ساخته می‌شود</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ساخت لینک
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
