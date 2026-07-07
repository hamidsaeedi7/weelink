"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { CalendarCheck, Loader2, Clock, CheckCircle2, CreditCard, Copy } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Service {
  id: string; name: string; description?: string; durationMins: number; price: string; isFree: boolean; color: string;
  bookingWindow: string;
}

export default function BookingPage() {
  const slug = useParams().slug as string;
  const [services, setServices] = useState<Service[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/appointments/services`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/api/v1/shops/${slug}`).then((r) => r.json()).catch(() => null),
    ]).then(([s, sh]) => {
      setServices((s?.data ?? s ?? []) as Service[]);
      setShop(sh?.data ?? sh);
      setLoading(false);
    });
  }, [slug]);

  // وقتی سرویس یا تاریخ عوض می‌شود، اسلات‌های آن روز را می‌گیرد و هر ۵ ثانیه تازه می‌کند
  // تا اگر مشتری دیگری همان لحظه یک نوبت را گرفت، بلافاصله «گرفته‌شده» دیده شود.
  const fetchSlots = useCallback(async () => {
    if (!selected || !date) return;
    setSlotsLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/shops/${slug}/appointments/services/${selected.id}/slots?date=${date}`);
      const d = await r.json();
      if (!r.ok) { setSlots([]); return; }
      setSlots((d?.data ?? d)?.slots || []);
    } catch { setSlots([]); }
    finally { setSlotsLoading(false); }
  }, [selected, date, slug]);

  useEffect(() => {
    setSlot(null);
    fetchSlots();
    if (timerRef.current) clearInterval(timerRef.current);
    if (selected && date) timerRef.current = setInterval(fetchSlots, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchSlots, selected, date]);

  const submit = async () => {
    if (!selected) { toast.error("سرویس را انتخاب کنید"); return; }
    if (!date) { toast.error("تاریخ را انتخاب کنید"); return; }
    if (!slot) { toast.error("یک زمان خالی انتخاب کنید"); return; }
    if (!name.trim()) { toast.error("نام الزامی است"); return; }
    if (!/^09[0-9]{9}$/.test(phone)) { toast.error("شماره موبایل معتبر وارد کنید"); return; }
    const iso = new Date(`${date}T${slot}:00`).toISOString();
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/v1/shops/${slug}/appointments/book`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: selected.id, customerName: name, customerPhone: phone, date: iso, note }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "خطا در ثبت نوبت");
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || "خطا در ثبت نوبت");
      fetchSlots(); // اگر زمان توسط شخص دیگری گرفته شده بود، لیست را تازه کن
      setSlot(null);
    }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  const amount = selected && !selected.isFree ? Number(selected.price) : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-8 px-4">
      <div className="max-w-md mx-auto space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-black flex items-center justify-center gap-2"><CalendarCheck className="w-5 h-5 text-orange-500" /> نوبت‌دهی آنلاین</h1>
          {shop?.name && <p className="text-sm text-white/50 mt-1">{shop.name}</p>}
        </div>

        {done ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
            <p className="font-bold">نوبت شما ثبت شد!</p>
            <p className="text-sm text-white/60">{selected?.name} — {new Date(`${date}T${slot}`).toLocaleDateString("fa-IR")} ساعت {slot}</p>
            {amount > 0 && shop?.cardNumber && <PayBox card={shop.cardNumber} holder={shop.cardHolder} bank={shop.bankName} amount={amount} />}
            <p className="text-xs text-white/40">فروشنده نوبت شما را بررسی و تأیید می‌کند.</p>
          </div>
        ) : services.length === 0 ? (
          <p className="text-center text-white/40 py-16">سرویسی برای رزرو موجود نیست</p>
        ) : (
          <>
            {/* services */}
            <div className="space-y-2">
              {services.map((s) => (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`w-full text-right rounded-2xl border p-4 transition-all ${selected?.id === s.id ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{s.name}</span>
                    <span className="text-orange-500 font-black text-sm">{s.isFree ? "رایگان" : formatPrice(Number(s.price))}</span>
                  </div>
                  {s.description && <p className="text-xs text-white/50 mt-1">{s.description}</p>}
                  <div className="flex items-center gap-1 text-[11px] text-white/40 mt-1"><Clock className="w-3 h-3" /> {s.durationMins} دقیقه</div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                <p className="text-sm font-bold">انتخاب تاریخ</p>
                <JalaliDatePicker value={date} onChange={setDate} placeholder="تاریخ" minToday />

                {date && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">انتخاب زمان</p>
                      {slotsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
                    </div>
                    {slots.length === 0 && !slotsLoading ? (
                      <p className="text-xs text-white/40 py-2">در این روز نوبتی موجود نیست — تاریخ دیگری انتخاب کنید</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {slots.map((s) => (
                          <button key={s.time} disabled={!s.available} onClick={() => setSlot(s.time)}
                            className={`py-2 rounded-lg text-xs font-mono border transition-all
                                        ${!s.available ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed line-through"
                                          : slot === s.time ? "bg-orange-500 border-orange-500 text-white font-bold"
                                          : "bg-white/5 border-white/10 text-white/80 hover:border-orange-500/50"}`}
                            dir="ltr">
                            {s.time}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-white/30">زمان‌های خط‌خورده قبلاً رزرو شده‌اند — این لیست هر ۵ ثانیه به‌روز می‌شود.</p>
                  </div>
                )}

                {slot && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره موبایل (۰۹...)" dir="ltr" inputMode="numeric"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-left focus:outline-none focus:border-orange-500/50" />
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="توضیحات (اختیاری)" rows={2}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm resize-none focus:outline-none focus:border-orange-500/50" />
                    <button onClick={submit} disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 font-bold text-sm disabled:opacity-60">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />} ثبت نوبت
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PayBox({ card, holder, bank, amount }: { card: string; holder?: string; bank?: string; amount: number }) {
  const pretty = card.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1-");
  return (
    <div className="rounded-xl bg-black/20 border border-white/10 p-3 space-y-2 text-right">
      <div className="flex items-center gap-2 text-xs font-bold text-white/80"><CreditCard className="w-3.5 h-3.5 text-orange-500" /> پرداخت بیعانه/هزینه (کارت‌به‌کارت)</div>
      <button onClick={() => { navigator.clipboard.writeText(card.replace(/\D/g, "")); toast.success("شماره کارت کپی شد"); }}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 group">
        <span className="font-mono tracking-widest text-white" dir="ltr">{pretty}</span><Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-orange-500" />
      </button>
      <button onClick={() => { navigator.clipboard.writeText(String(amount)); toast.success("مبلغ کپی شد"); }}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 group">
        <span className="text-xs text-white/50">مبلغ</span><span className="flex items-center gap-2"><span className="font-bold text-orange-500">{formatPrice(amount)}</span><Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-orange-500" /></span>
      </button>
      {(holder || bank) && <div className="flex justify-between text-[11px] text-white/50">{holder && <span>به نام: {holder}</span>}{bank && <span>{bank}</span>}</div>}
    </div>
  );
}
