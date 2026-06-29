"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Filter, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi, fmtDate } from "@/lib/api";

interface LogEntry {
  id: string;
  admin: { email?: string; phone?: string };
  action: string;
  target?: string;
  createdAt: string;
  data?: unknown;
}

const ACTION_COLORS: Record<string, string> = {
  UPDATE_USER: "bg-blue-500/20 text-blue-400",
  UPDATE_SETTINGS: "bg-purple-500/20 text-purple-400",
  SET_ROLE_ADMIN: "bg-orange-500/20 text-orange-400",
  DELETE: "bg-red-500/20 text-red-400",
  DELETE_USER: "bg-red-500/20 text-red-400",
  DELETE_PAGE: "bg-red-500/20 text-red-400",
};

function ActionBadge({ action }: { action: string }) {
  const cls = Object.keys(ACTION_COLORS).find(k => action.includes(k)) 
    ? ACTION_COLORS[Object.keys(ACTION_COLORS).find(k => action.includes(k))!]
    : "bg-white/10 text-white/60";
  return (
    <span className={`inline-block font-mono text-xs px-2 py-1 rounded ${cls}`}>{action}</span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ساعت پیش`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} روز پیش`;
  return fmtDate(dateStr);
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");

  const pageSize = 20;

  const load = async (p: number) => {
    try {
      setLoading(true);
      const res = await adminApi.getLogs(p);
      const logArr = Array.isArray(res) ? res : (res.logs ?? res.data ?? []);
      setLogs(logArr);
      setTotal(res.total ?? logArr.length);
    } catch {
      toast.error("خطا در بارگذاری لاگ‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const allActions = Array.from(new Set(logs.map(l => l.action))).sort();
  const filtered = actionFilter ? logs.filter(l => l.action === actionFilter) : logs;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">لاگ‌های فعالیت</h1>
          <p className="text-white/50 text-sm mt-1">تاریخچه اقدامات ادمین‌ها</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-white/40" />
          <select
            className="input-base text-sm"
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">همه اقدامات</option>
            {allActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-white/50">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-white/30">لاگی یافت نشد</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="text-right px-5 py-3 font-medium">ادمین</th>
                <th className="text-right px-5 py-3 font-medium">اقدام</th>
                <th className="text-right px-5 py-3 font-medium">هدف</th>
                <th className="text-right px-5 py-3 font-medium">زمان</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const expanded = expandedId === log.id;
                const hasData = log.data && Object.keys(log.data as object).length > 0;
                return (
                  <>
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-5 py-3.5 text-white/80 font-medium">{log.admin?.email || log.admin?.phone || "—"}</td>
                      <td className="px-5 py-3.5"><ActionBadge action={log.action} /></td>
                      <td className="px-5 py-3.5 text-white/50 font-mono text-xs">{log.target || "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 text-white/50 text-xs">
                          <Clock size={11} />
                          <span title={fmtDate(log.createdAt)}>{timeAgo(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {hasData && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : log.id)}
                            className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition"
                          >
                            داده‌ها
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded && hasData && (
                      <tr key={`${log.id}-data`} className="border-b border-white/5 bg-white/3">
                        <td colSpan={5} className="px-8 py-3">
                          <pre className="text-xs text-white/60 font-mono bg-black/20 rounded-lg p-3 overflow-x-auto max-h-48 whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-white/40 text-sm">صفحه {page} از {totalPages}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pg = start + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-sm transition ${pg === page ? "bg-white/20 text-white font-medium" : "bg-white/5 text-white/50 hover:bg-white/15"}`}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
