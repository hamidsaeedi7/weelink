"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Handshake, Copy, Trash2, Pencil, X, BarChart3, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const EMPTY = { title: "", originalUrl: "", commission: 10 };

export default function AffiliatePage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/affiliate`, { headers: auth() });
      const d = await r.json();
      setLinks(d.data || d || []);
    } catch { setLinks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.originalUrl) { toast.error("عنوان و آدرس الزامی است"); return; }
    setSaving(true);
    try {
      const url = editing ? `${API}/api/v1/affiliate/${editing.id}` : `${API}/api/v1/affiliate`;
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, commission: Number(form.commission) }),
      });
      if (!r.ok) throw new Error();
      toast.success(editing ? "ویرایش شد" : "لینک همکاری اضافه شد");
      setShowForm(false);
      load();
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await fetch(`${API}/api/v1/affiliate/${id}`, { method: "DELETE", headers: auth() });
    setLinks((p) => p.filter((l) => l.id !== id));
    toast.success("حذف شد");
  };

  const copy = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/ref/${id}`);
    toast.success("لینک کپی شد");
  };

  const totalEarnings = links.reduce((sum, l) => sum + (l.earnings || 0), 0);
  const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">همکاری در فروش</h1>
          <p className="text-sm text-gray-500">لینک‌های معرفی با پیگیری کمیسیون</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 py-2.5 px-4">
          <Plus className="w-4 h-4" /> لینک جدید
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">کل درآمد</p>
            <p className="font-black text-gray-900 dark:text-white">{formatPrice(totalEarnings)}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">کل کلیک</p>
            <p className="font-black text-gray-900 dark:text-white">{totalClicks.toLocaleString("fa-IR")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : links.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Handshake className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-700 dark:text-gray-300">هنوز لینک همکاری اضافه نکرده‌اید</p>
          <p className="text-sm text-gray-500">محصولات دیگران را معرفی کنید و کمیسیون دریافت کنید</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{l.title}</h3>
                    <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-lg border border-green-500/20">
                      {l.commission}% کمیسیون
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{l.originalUrl}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {l.clickCount} کلیک</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500" /> {formatPrice(l.earnings || 0)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => copy(l.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setForm({ ...l }); setEditing(l); setShowForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(l.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500">
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
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? "ویرایش لینک" : "لینک همکاری جدید"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">عنوان *</label>
                <input value={form.title} onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
                  className="input-base" placeholder="مثال: هدفون سونی" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">لینک اصلی *</label>
                <input value={form.originalUrl} onChange={(e) => setForm((p: any) => ({ ...p, originalUrl: e.target.value }))}
                  className="input-base" placeholder="https://..." dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">درصد کمیسیون</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={form.commission}
                    onChange={(e) => setForm((p: any) => ({ ...p, commission: e.target.value }))}
                    className="input-base pl-8" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  ذخیره
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
