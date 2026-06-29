"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Loader2, MessageSquare, ChevronLeft, Send, X, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ticketsApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN:        { label: "باز",           color: "bg-blue-500/20 text-blue-400" },
  IN_PROGRESS: { label: "در حال بررسی", color: "bg-yellow-500/20 text-yellow-400" },
  RESOLVED:    { label: "حل شده",       color: "bg-green-500/20 text-green-400" },
  CLOSED:      { label: "بسته",         color: "bg-gray-500/20 text-gray-400" },
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const load = async () => {
    try {
      const data = await ticketsApi.getAll() as any[];
      setTickets(data || []);
    } catch { toast.error("خطا"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.replies?.length]);

  const onCreateTicket = async (data: any) => {
    try {
      const ticket = await ticketsApi.create(data) as any;
      setTickets((prev) => [ticket, ...prev]);
      setSelected(ticket);
      setShowNew(false);
      reset();
      toast.success("تیکت ثبت شد");
    } catch { toast.error("خطا در ثبت تیکت"); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplying(true);
    try {
      const reply = await ticketsApi.reply(selected.id, replyText) as any;
      setSelected((t: any) => ({ ...t, replies: [...(t.replies || []), reply], status: "IN_PROGRESS" }));
      setTickets((prev) => prev.map((t) => t.id === selected.id ? { ...t, status: "IN_PROGRESS" } : t));
      setReplyText("");
    } catch { toast.error("خطا"); }
    finally { setReplying(false); }
  };

  const closeTicket = async () => {
    if (!selected) return;
    try {
      await ticketsApi.close(selected.id);
      setSelected((t: any) => ({ ...t, status: "CLOSED" }));
      setTickets((prev) => prev.map((t) => t.id === selected.id ? { ...t, status: "CLOSED" } : t));
      toast.success("تیکت بسته شد");
    } catch { toast.error("خطا"); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">پشتیبانی</h1>
          <p className="text-sm text-gray-500">{tickets.length} تیکت</p>
        </div>
        <button onClick={() => { setShowNew(true); setSelected(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(249,115,22,0.25)]">
          <Plus className="w-4 h-4" />
          تیکت جدید
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ticket List */}
        <div className="space-y-2 lg:col-span-1">
          {tickets.length === 0 && !showNew ? (
            <div className="text-center py-12 text-gray-400 space-y-3">
              <MessageSquare className="w-10 h-10 mx-auto opacity-20" />
              <p className="text-sm">تیکتی ندارید</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const st = STATUS_MAP[ticket.status] || STATUS_MAP.OPEN;
              return (
                <button key={ticket.id}
                  onClick={() => { setSelected(ticket); setShowNew(false); }}
                  className={`w-full text-right p-4 rounded-2xl border transition-all ${
                    selected?.id === ticket.id
                      ? "border-orange-500/40 bg-orange-500/5"
                      : "border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-orange-500/20"
                  }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{ticket.subject}</span>
                    <ChevronLeft className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${st.color}`}>{st.label}</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(ticket.createdAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* New Ticket Form */}
        {showNew && (
          <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-gray-900 dark:text-white">تیکت جدید</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onCreateTicket)} className="space-y-4">
              <input {...register("subject", { required: true })}
                placeholder="موضوع تیکت *"
                className="input-base" />
              <select {...register("priority")} className="input-base text-sm">
                <option value="NORMAL">اولویت معمولی</option>
                <option value="HIGH">اولویت بالا</option>
                <option value="URGENT">فوری</option>
                <option value="LOW">کم اهمیت</option>
              </select>
              <textarea {...register("message", { required: true })}
                rows={6}
                placeholder="توضیح کامل مشکل یا سوال خود را بنویسید..."
                className="input-base resize-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNew(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-bold">
                  انصراف
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  ارسال تیکت
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ticket Detail */}
        {selected && !showNew && (
          <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-white/5">
              <div>
                <h2 className="font-black text-gray-900 dark:text-white">{selected.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${STATUS_MAP[selected.status]?.color || ""}`}>
                    {STATUS_MAP[selected.status]?.label}
                  </span>
                  <span className="text-xs text-gray-400">{timeAgo(selected.createdAt)}</span>
                </div>
              </div>
              {selected.status !== "CLOSED" && (
                <button onClick={closeTicket}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:border-green-500/40 hover:text-green-500 transition-all">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  بستن تیکت
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Original message */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-orange-500/10 rounded-2xl rounded-tr-sm p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selected.message}</p>
                  <p className="text-[10px] text-gray-400 mt-2 text-left">{timeAgo(selected.createdAt)}</p>
                </div>
              </div>

              {/* Replies */}
              {(selected.replies || []).map((reply: any) => (
                <div key={reply.id} className={`flex ${reply.isAdmin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-4 ${
                    reply.isAdmin
                      ? "bg-gray-100 dark:bg-white/10 rounded-tl-sm"
                      : "bg-orange-500/10 rounded-tr-sm"
                  }`}>
                    {reply.isAdmin && (
                      <p className="text-[10px] font-bold text-orange-400 mb-1">پشتیبانی ویلینک</p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 text-left">{timeAgo(reply.createdAt)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply Input */}
            {selected.status !== "CLOSED" && (
              <div className="border-t border-gray-100 dark:border-white/5 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    rows={2}
                    placeholder="پیام خود را بنویسید..."
                    className="input-base flex-1 resize-none text-sm"
                  />
                  <button onClick={sendReply} disabled={replying || !replyText.trim()}
                    className="px-4 rounded-xl bg-orange-500 text-white hover:bg-orange-400 transition-all disabled:opacity-40 flex items-center justify-center">
                    {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
