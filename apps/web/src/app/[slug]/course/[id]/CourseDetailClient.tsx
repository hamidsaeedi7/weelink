"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BookOpen, Loader2, PlayCircle, Lock, ChevronDown, ArrowRight, KeyRound, LogIn } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { formatPrice, toPersianNumber } from "@/lib/utils";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { PurchaseModal } from "@/components/PurchaseModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function accessKey(courseId: string) { return `weelink_course_access_${courseId}`; }

// ویدیوی یک قسمت — لینک امضاشدهٔ موقت را می‌گیرد، بعد پخش می‌کند (لینک خام هیچ‌وقت در صفحه ظاهر نمی‌شود)
function ChapterVideo({ courseId, chapterId, index, title, poster, accessToken, watermarkText, watermarkColor, watermarkCount }: any) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setSrc(null); setError(false);
    const qs = new URLSearchParams({ video: String(index) });
    if (accessToken) qs.set("accessToken", accessToken);
    axios.get(`${API}/api/v1/courses/${courseId}/chapters/${chapterId}/video-url?${qs}`)
      .then(({ data }) => setSrc((data.data || data).url))
      .catch(() => setError(true));
  }, [courseId, chapterId, index, accessToken]);

  if (error) return <p className="text-xs text-red-400">خطا در بارگذاری ویدیو — دسترسی شما معتبر نیست.</p>;
  if (!src) return <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>;

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-white/60">{title}</p>
      <SecureVideoPlayer src={src} poster={poster} watermarkText={watermarkText} watermarkColor={watermarkColor} watermarkCount={watermarkCount} />
    </div>
  );
}

export default function CourseDetailClient({ slug, id, course, shop }: { slug: string; id: string; course: any; shop: any }) {
  const sp = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);

  const [access, setAccess] = useState<{ accessToken: string; buyerName: string; buyerPhone: string } | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [licenseCode, setLicenseCode] = useState(sp.get("license") || "");
  const [redeemPhone, setRedeemPhone] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(accessKey(id));
    if (raw) {
      try { setAccess(JSON.parse(raw)); } catch { /* ignore */ }
    } else if (sp.get("license")) {
      setRedeemOpen(true);
    }
  }, [id, sp]);

  const redeem = async () => {
    if (!/^\d{6,}$/.test(licenseCode.replace(/-/g, "")) && licenseCode.trim().length < 6) {
      toast.error("کد لایسنس را وارد کنید"); return;
    }
    if (!/^09\d{9}$/.test(redeemPhone.trim())) { toast.error("شماره موبایل معتبر نیست"); return; }
    setRedeeming(true);
    try {
      const { data } = await axios.post(`${API}/api/v1/courses/license/redeem`, {
        code: licenseCode.trim(), phone: redeemPhone.trim(),
      });
      const d = data.data || data;
      const info = { accessToken: d.accessToken, buyerName: d.buyerName, buyerPhone: d.buyerPhone };
      localStorage.setItem(accessKey(id), JSON.stringify(info));
      setAccess(info);
      setRedeemOpen(false);
      toast.success("خوش آمدید! به دوره دسترسی دارید.");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "کد لایسنس یا شماره موبایل نادرست است");
    } finally {
      setRedeeming(false);
    }
  };

  const chapters = course.chapters || [];
  const watermarkText = access?.buyerPhone ? toPersianNumber(access.buyerPhone) : course.watermarkText;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <a href={`/${slug}/courses`} className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-orange-500">
          <ArrowRight className="w-4 h-4" /> همهٔ دوره‌ها
        </a>

        {course.coverUrl && <img src={course.coverUrl} alt={course.title} className="w-full h-48 object-cover rounded-2xl" />}

        <div className="space-y-2">
          <h1 className="text-2xl font-black flex items-center gap-2"><BookOpen className="w-6 h-6 text-orange-500" /> {course.title}</h1>
          {course.description && <p className="text-sm text-white/60 leading-relaxed">{course.description}</p>}
        </div>

        {/* خرید / ورود با لایسنس */}
        {!access && (
          <div className="space-y-2">
            {!course.isFree && (
              <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4">
                <span className="font-black text-orange-500 text-lg">{formatPrice(Number(course.price))}</span>
                <button onClick={() => setBuy(true)} className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-bold transition-all">
                  خرید دوره
                </button>
              </div>
            )}
            <button onClick={() => setRedeemOpen((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-orange-400 hover:border-orange-500/30 text-sm transition-all">
              <LogIn className="w-4 h-4" /> قبلاً خریده‌اید؟ ورود با لایسنس
            </button>
            {redeemOpen && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white/80"><KeyRound className="w-4 h-4 text-orange-500" /> ورود با کد لایسنس</div>
                <input value={licenseCode} onChange={(e) => setLicenseCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX" dir="ltr"
                  className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm text-left font-mono tracking-wide focus:outline-none focus:border-orange-500/50" />
                <input value={redeemPhone} onChange={(e) => setRedeemPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="شماره موبایل خریدار" dir="ltr" inputMode="numeric" maxLength={11}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm text-left focus:outline-none focus:border-orange-500/50" />
                <button onClick={redeem} disabled={redeeming}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold disabled:opacity-60">
                  {redeeming && <Loader2 className="w-4 h-4 animate-spin" />} ورود به دوره
                </button>
              </div>
            )}
          </div>
        )}
        {access && (
          <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-3 text-center text-sm text-green-400">
            خوش آمدید {access.buyerName} — به این دوره دسترسی دارید.
          </div>
        )}

        {/* فصل‌ها */}
        <div className="space-y-2">
          {chapters.map((ch: any, i: number) => {
            const isOpen = open === ch.id;
            const vids = ch.videos || [];
            const unlocked = ch.isPreview || !!access;
            const locked = !unlocked;
            return (
              <div key={ch.id} className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03]">
                <button onClick={() => setOpen(isOpen ? null : ch.id)}
                  className="w-full flex items-center gap-3 p-4 text-right">
                  <span className="text-xs text-white/40 w-5">{i + 1}</span>
                  {locked ? <Lock className="w-4 h-4 text-white/30 shrink-0" /> : <PlayCircle className="w-4 h-4 text-green-400 shrink-0" />}
                  <span className="flex-1 text-sm font-medium">{ch.title}</span>
                  <span className="text-[10px] text-white/30">{unlocked ? `${vids.length || ""} ویدیو`.trim() : "قفل"}</span>
                  {!locked && <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                </button>
                {isOpen && unlocked && (
                  <div className="p-4 pt-0 space-y-4">
                    {vids.length === 0 && <p className="text-xs text-white/40">ویدیویی در این فصل نیست.</p>}
                    {vids.map((v: any, vi: number) => (
                      <ChapterVideo key={vi} courseId={id} chapterId={ch.id} index={vi} title={v.title} poster={v.coverUrl}
                        accessToken={access?.accessToken}
                        watermarkText={watermarkText} watermarkColor={course.watermarkColor} watermarkCount={course.watermarkCount} />
                    ))}
                  </div>
                )}
                {isOpen && locked && (
                  <div className="p-4 pt-0">
                    <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center text-xs text-orange-400">
                      برای دسترسی به این فصل، دوره را خریداری کنید.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {buy && <PurchaseModal item={course} shop={shop} onClose={() => setBuy(false)} kind="COURSE" />}
    </div>
  );
}
