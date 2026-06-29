"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Download, Trash2, Search, Zap } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

export default function AudiencePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const r = await fetch(`${API}/api/v1/audience`, { headers: auth() });
      if (r.status === 403) { setIsPro(false); setLoading(false); return; }
      const d = await r.json();
      setIsPro(true);
      setLeads(d.data || d || []);
    } catch { setLeads([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    const rows = [["ایمیل", "نام", "منبع", "تاریخ"]];
    filtered.forEach((l) => rows.push([l.email, l.name || "", l.source || "", new Date(l.createdAt).toLocaleDateString("fa-IR")]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
    a.download = "audience.csv";
    a.click();
    toast.success("فایل CSV دانلود شد");
  };

  const remove = async (id: string) => {
    await fetch(`${API}/api/v1/audience/${id}`, { method: "DELETE", headers: auth() });
    setLeads((p) => p.filter((l) => l.id !== id));
    toast.success("حذف شد");
  };

  const filtered = leads.filter((l) =>
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    (l.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!isPro && !loading) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">مدیریت مخاطبان</h1>
        <p className="text-sm text-gray-500">ایمیل‌های جمع‌آوری‌شده از بازدیدکنندگان</p>
      </div>
      <div className="glass-card p-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">این ویژگی برای پلن Pro است</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          با ارتقا به Pro می‌توانید همه ایمیل‌های جمع‌آوری‌شده را ببینید و CSV خروجی بگیرید
        </p>
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
          <h1 className="text-xl font-black text-gray-900 dark:text-white">مدیریت مخاطبان</h1>
          <p className="text-sm text-gray-500">{leads.length} مخاطب جمع‌آوری‌شده</p>
        </div>
        {leads.length > 0 && (
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            <Download className="w-4 h-4" /> خروجی CSV
          </button>
        )}
      </div>

      {leads.length > 0 && (
        <div className="relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-base pr-10" placeholder="جستجو در ایمیل‌ها..." />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : leads.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-700 dark:text-gray-300">هنوز مخاطبی جمع‌آوری نشده</p>
          <p className="text-sm text-gray-500">با اضافه کردن بلوک «جمع‌آوری ایمیل» به صفحه بیو، مخاطبان را جمع‌آوری کنید</p>
          <a href="/dashboard/blocks" className="btn-primary py-2 px-4 text-sm inline-flex items-center gap-2">
            رفتن به لینک‌ها
          </a>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">ایمیل</th>
                <th className="text-right text-xs font-bold text-gray-500 px-4 py-3 hidden sm:table-cell">نام</th>
                <th className="text-right text-xs font-bold text-gray-500 px-4 py-3 hidden md:table-cell">منبع</th>
                <th className="text-right text-xs font-bold text-gray-500 px-4 py-3 hidden md:table-cell">تاریخ</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={`${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-white/[0.02]"} hover:bg-gray-50 dark:hover:bg-white/5`}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{l.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{l.name || "—"}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {l.source && <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-lg">{l.source}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                    {new Date(l.createdAt).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(l.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
