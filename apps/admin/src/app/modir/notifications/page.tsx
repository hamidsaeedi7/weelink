"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Send, Trash2, Bell } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "error";
  targetPlan: string;
  createdAt: string;
}

const TYPE_CONFIG = {
  info: { label: "اطلاعات", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  success: { label: "موفق", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  warning: { label: "هشدار", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  error: { label: "خطا", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${mins} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ساعت پیش`;
  const days = Math.floor(hours / 24);
  return `${days} روز پیش`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "info",
    targetPlan: "ALL",
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getNotifications();
      setNotifications(data ?? []);
    } catch {
      toast.error("خطا در بارگذاری اعلان‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("عنوان الزامی است"); return; }
    if (!form.body.trim()) { toast.error("متن الزامی است"); return; }
    setSending(true);
    try {
      // targetPlan is nullable on the backend ("همه" = no filter); the API
      // rejects any value outside FREE/PRO, so omit it rather than send "ALL".
      const { targetPlan, ...rest } = form;
      await adminApi.sendNotification(targetPlan === "ALL" ? rest : form);
      toast.success("اعلان ارسال شد");
      setForm({ title: "", body: "", type: "info", targetPlan: "ALL" });
      loadNotifications();
    } catch {
      toast.error("خطا در ارسال اعلان");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این اعلان اطمینان دارید؟")) return;
    try {
      await adminApi.deleteNotification(id);
      toast.success("اعلان حذف شد");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("خطا در حذف اعلان");
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مدیریت اعلان‌ها</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">ارسال اعلان به کاربران</p>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <Bell size={18} />
          ارسال اعلان جدید
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              عنوان <span className="text-red-500">*</span>
            </label>
            <input
              className="input-base w-full"
              placeholder="عنوان اعلان"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              متن <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-base w-full resize-none"
              rows={3}
              placeholder="متن اعلان را وارد کنید..."
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                نوع
              </label>
              <select
                className="input-base w-full"
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="info">اطلاعات</option>
                <option value="success">موفق</option>
                <option value="warning">هشدار</option>
                <option value="error">خطا</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                مخاطب
              </label>
              <select
                className="input-base w-full"
                value={form.targetPlan}
                onChange={(e) => set("targetPlan", e.target.value)}
              >
                <option value="ALL">همه</option>
                <option value="FREE">FREE</option>
                <option value="PRO">PRO</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? "در حال ارسال..." : "ارسال"}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-800 dark:text-white">اعلان‌های ارسال شده</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-gray-400">اعلانی ارسال نشده</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
              return (
                <div key={n.id} className="flex items-start justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{n.title}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {n.targetPlan === "ALL" ? "همه" : n.targetPlan}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="mr-4 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors flex-shrink-0"
                    title="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
