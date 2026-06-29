"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { adminApi, timeAgo } from "@/lib/api";
import { Send, RefreshCw, MessageSquare, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

type TicketStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Reply {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  author?: { email?: string; phone?: string };
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  user: { email?: string; phone?: string };
  replies?: Reply[];
}

const STATUS_TABS: { label: string; value: TicketStatus | "ALL" }[] = [
  { label: "همه", value: "ALL" },
  { label: "باز", value: "OPEN" },
  { label: "در حال بررسی", value: "IN_REVIEW" },
  { label: "حل شده", value: "RESOLVED" },
  { label: "بسته", value: "CLOSED" },
];

function statusBadge(status: TicketStatus) {
  const map: Record<TicketStatus, { label: string; icon: React.ElementType; className: string }> = {
    OPEN: { label: "باز", icon: AlertCircle, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    IN_REVIEW: { label: "در بررسی", icon: Clock, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
    RESOLVED: { label: "حل شده", icon: CheckCircle, className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    CLOSED: { label: "بسته", icon: XCircle, className: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  };
  const cfg = map[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function priorityBadge(priority: Priority) {
  const map: Record<Priority, { label: string; className: string }> = {
    LOW: { label: "کم", className: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400" },
    MEDIUM: { label: "متوسط", className: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300" },
    HIGH: { label: "زیاد", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
    URGENT: { label: "فوری", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  };
  const cfg = map[priority];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTickets(statusFilter === "ALL" ? undefined : statusFilter);
      setTickets(data.tickets ?? data);
    } catch {
      console.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedTicket?.replies]);

  async function handleReply() {
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await adminApi.replyTicket(selectedTicket.id, replyText.trim());
      setReplyText("");
      fetchTickets();
      // Update selected ticket replies optimistically
      const newReply: Reply = {
        id: Date.now().toString(),
        message: replyText.trim(),
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };
      setSelectedTicket((prev) =>
        prev ? { ...prev, replies: [...(prev.replies ?? []), newReply] } : prev
      );
    } catch {
      console.error("خطا در ارسال پاسخ");
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(status: TicketStatus) {
    if (!selectedTicket) return;
    try {
      await adminApi.setTicketStatus(selectedTicket.id, status);
      setSelectedTicket((prev) => (prev ? { ...prev, status } : prev));
      fetchTickets();
    } catch {
      console.error("خطا در تغییر وضعیت");
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-80px)]" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مدیریت تیکت‌ها</h1>
        <button onClick={fetchTickets} className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          بازخوانی
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Split layout */}
      <div className="flex gap-4 h-[calc(100%-140px)]">
        {/* Ticket list (right, 1/3) */}
        <div className="w-1/3 glass-card overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={24} className="animate-spin text-orange-500" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare size={36} className="text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">هیچ تیکتی یافت نشد</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {tickets.map((ticket) => (
                  <li
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? "bg-orange-50 dark:bg-orange-900/20 border-r-2 border-orange-500"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                      {ticket.user.email || ticket.user.phone}
                    </p>
                    <div className="flex items-center gap-2">
                      {statusBadge(ticket.status)}
                      {priorityBadge(ticket.priority)}
                      <span className="text-xs text-gray-400 dark:text-gray-500 mr-auto">
                        {timeAgo(ticket.createdAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Ticket detail (left, 2/3) */}
        <div className="flex-1 glass-card overflow-hidden flex flex-col">
          {!selectedTicket ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">یک تیکت انتخاب کنید</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                برای مشاهده جزئیات و پاسخ‌دهی از لیست سمت راست انتخاب کنید
              </p>
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedTicket.user.email || selectedTicket.user.phone}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {statusBadge(selectedTicket.status)}
                    {priorityBadge(selectedTicket.priority)}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(selectedTicket.createdAt)}
                    </span>
                  </div>
                </div>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="input-base text-sm w-40"
                >
                  <option value="OPEN">باز</option>
                  <option value="IN_REVIEW">در حال بررسی</option>
                  <option value="RESOLVED">حل شده</option>
                  <option value="CLOSED">بسته</option>
                </select>
              </div>

              {/* Chat area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tr-sm p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                      {selectedTicket.user.email || selectedTicket.user.phone}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {selectedTicket.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-left">
                      {timeAgo(selectedTicket.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {(selectedTicket.replies ?? []).map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex ${reply.isAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 ${
                        reply.isAdmin
                          ? "bg-orange-500 text-white rounded-tl-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tr-sm"
                      }`}
                    >
                      {reply.isAdmin && (
                        <p className="text-xs text-orange-100 mb-1 font-medium">ادمین</p>
                      )}
                      <p className="text-sm leading-relaxed">{reply.message}</p>
                      <p
                        className={`text-xs mt-1 text-left ${
                          reply.isAdmin ? "text-orange-200" : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {timeAgo(reply.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Reply input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
                    }}
                    placeholder="پاسخ خود را بنویسید... (Ctrl+Enter برای ارسال)"
                    rows={3}
                    className="input-base flex-1 resize-none text-sm"
                  />
                  <button
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                    className="btn-primary flex items-center justify-center w-12 h-12 self-end disabled:opacity-50"
                  >
                    {sending ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
