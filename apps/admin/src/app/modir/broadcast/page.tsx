"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Send, MessageCircle, MessageSquareText } from "lucide-react";
import { adminApi } from "@/lib/api";

const CHANNELS = [
  { value: "telegram", label: "تلگرام", icon: Send, color: "text-blue-500" },
  { value: "bale", label: "بله", icon: MessageCircle, color: "text-[#1BA0C7]" },
  { value: "sms", label: "پیامک", icon: MessageSquareText, color: "text-emerald-500" },
];

const AUDIENCES = [
  { value: "all", label: "همه کاربران" },
  { value: "free", label: "کاربران رایگان" },
  { value: "pro", label: "کاربران Pro" },
];

export default function BroadcastPage() {
  const [message, setMessage] = useState("");
  const [channel, setChannel] = useState("sms");
  const [audience, setAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ total: number; sent: number; skipped: number } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { toast.error("متن پیام الزامی است"); return; }
    if (!confirm("پیام برای کاربران انتخاب‌شده ارسال شود؟")) return;
    setSending(true);
    setResult(null);
    try {
      const data = await adminApi.sendBroadcast({ message: message.trim(), channel, audience });
      setResult(data);
      toast.success(`ارسال شد به ${data.sent} کاربر از ${data.total}`);
      setMessage("");
    } catch {
      toast.error("خطا در ارسال پیام همگانی");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">پیام همگانی</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          ارسال پیام به کاربران از طریق تلگرام، بله یا پیامک
        </p>
      </div>

      <div className="glass-card p-6 max-w-2xl">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <Megaphone size={18} />
          ارسال پیام جدید
        </h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              متن پیام <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-base w-full resize-none"
              rows={4}
              placeholder="متن پیام را وارد کنید..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              روش ارسال
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                const active = channel === c.value;
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setChannel(c.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      active
                        ? "border-accent-500 bg-accent-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    <Icon size={18} className={active ? c.color : "text-gray-400"} />
                    <span className={`text-xs font-medium ${active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              مخاطب
            </label>
            <select
              className="input-base w-full"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? "در حال ارسال..." : "ارسال پیام"}
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{result.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">مخاطب هدف</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{result.sent}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ارسال موفق</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-400">{result.skipped}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">بدون اتصال / رد شده</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
