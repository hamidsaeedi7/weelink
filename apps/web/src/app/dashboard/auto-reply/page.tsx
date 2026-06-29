"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Bot, Trash2, Pencil, X, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const PLATFORMS = [
  { id: "telegram", label: "تلگرام", color: "#2AABEE" },
  { id: "instagram", label: "اینستاگرام", color: "#E1306C" },
  { id: "eitaa", label: "ایتا", color: "#EE7F22" },
  { id: "rubika", label: "روبیکا", color: "#6C2BD9" },
  { id: "bale", label: "بله", color: "#00A652" },
  { id: "whatsapp", label: "واتساپ", color: "#25D366" },
];

const EMPTY = { platform: "instagram", keyword: "", reply: "", isActive: true };

export default function AutoReplyPage() {
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/auto-reply`, { headers: auth() });
      const d = await r.json();
      setReplies(d.data || d || []);
    } catch { setReplies([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.keyword || !form.reply) { toast.error("کلیدواژه و پیام الزامی است"); return; }
    setSaving(true);
    try {
      const url = editing ? `${API}/api/v1/auto-reply/${editing.id}` : `${API}/api/v1/auto-reply`;
      const r = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error();
      toast.success(editing ? "ویرایش شد" : "قانون اضافه شد");
      setShowForm(false);
      load();
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const toggle = async (r: any) => {
    await fetch(`${API}/api/v1/auto-reply/${r.id}`, {
      method: "PUT",
      headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !r.isActive }),
    });
    setReplies((p) => p.map((x) => x.id === r.id ? { ...x, isActive: !x.isActive } : x));
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/auto-reply/${id}`, { method: "DELETE", headers: auth() });
    setReplies((p) => p.filter((x) => x.id !== id));
    toast.success("حذف شد");
  };

  const getPlatform = (id: string) => PLATFORMS.find((p) => p.id === id) || PLATFORMS[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">پاسخ‌دهی خودکار</h1>
          <p className="text-sm text-gray-500">وقتی کسی کلیدواژه‌ای نوشت، به صورت خودکار پاسخ بگیرد</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2 py-2.5 px-4">
          <Plus className="w-4 h-4" /> قانون جدید
        </button>
      </div>

      <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
        <p className="text-sm text-blue-600 dark:text-blue-400 flex gap-2">
          <Bot className="w-4 h-4 mt-0.5 shrink-0" />
          <span>برای فعال‌سازی پاسخ خودکار در هر پلتفرم، باید ربات یا اکانت رسمی آن پلتفرم را به ویلینک متصل کنید. این ویژگی در نسخه بعدی فعال خواهد شد.</span>
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : replies.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Bot className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-700 dark:text-gray-300">هنوز قانون پاسخ خودکار اضافه نکرده‌اید</p>
          <p className="text-sm text-gray-500">مثال: وقتی کسی «قیمت» نوشت، لینک قیمت‌ها را ارسال کنید</p>
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map((r) => {
            const p = getPlatform(r.platform);
            return (
              <div key={r.id} className={`glass-card p-4 ${!r.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg text-white shrink-0"
                    style={{ background: p.color }}>{p.label}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">اگر نوشت:</span>
                      <code className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-lg text-gray-900 dark:text-white font-bold">{r.keyword}</code>
                    </div>
                    <p className="text-xs text-gray-500">↳ {r.reply}</p>
                    {r.triggerCount > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">{r.triggerCount} بار اجرا شده</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggle(r)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                      {r.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setForm({ ...r }); setEditing(r); setShowForm(true); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111120] rounded-2xl border border-gray-200 dark:border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">{editing ? "ویرایش قانون" : "قانون جدید"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">پلتفرم</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button key={p.id} onClick={() => setForm((prev: any) => ({ ...prev, platform: p.id }))}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                        form.platform === p.id
                          ? "text-white border-transparent"
                          : "text-gray-500 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                      }`}
                      style={form.platform === p.id ? { background: p.color, borderColor: p.color } : {}}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">کلیدواژه *</label>
                <input value={form.keyword} onChange={(e) => setForm((p: any) => ({ ...p, keyword: e.target.value }))}
                  className="input-base" placeholder="مثال: قیمت — یا: سلام" />
                <p className="text-xs text-gray-400 mt-1">وقتی کاربر این متن را بنویسد، پاسخ ارسال می‌شود</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">پاسخ خودکار *</label>
                <textarea value={form.reply} onChange={(e) => setForm((p: any) => ({ ...p, reply: e.target.value }))}
                  className="input-base resize-none h-24" placeholder="متن پاسخی که ارسال می‌شود..." />
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
