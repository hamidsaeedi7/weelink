"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2, PlayCircle, Lock, ChevronDown, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { SecureVideoPlayer } from "@/components/SecureVideoPlayer";
import { PurchaseModal } from "@/components/PurchaseModal";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function CourseDetailPage() {
  const { slug, id } = useParams() as { slug: string; id: string };
  const [course, setCourse] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/courses`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/api/v1/shops/${slug}`).then((r) => r.json()).catch(() => null),
    ]).then(([c, s]) => {
      const list = c?.data ?? c ?? [];
      setCourse(list.find((x: any) => x.id === id) || null);
      setShop(s?.data ?? s);
      setLoading(false);
    });
  }, [slug, id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;
  if (!course) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F] text-white/50">دوره یافت نشد</div>;

  const chapters = course.chapters || [];

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

        {/* خرید */}
        {!course.isFree && (
          <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4">
            <span className="font-black text-orange-500 text-lg">{formatPrice(Number(course.price))}</span>
            <button onClick={() => setBuy(true)} className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-bold transition-all">
              خرید دوره
            </button>
          </div>
        )}

        {/* فصل‌ها */}
        <div className="space-y-2">
          {chapters.map((ch: any, i: number) => {
            const isOpen = open === ch.id;
            const vids = ch.videos || [];
            const locked = !ch.isPreview;
            return (
              <div key={ch.id} className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03]">
                <button onClick={() => setOpen(isOpen ? null : ch.id)}
                  className="w-full flex items-center gap-3 p-4 text-right">
                  <span className="text-xs text-white/40 w-5">{i + 1}</span>
                  {locked ? <Lock className="w-4 h-4 text-white/30 shrink-0" /> : <PlayCircle className="w-4 h-4 text-green-400 shrink-0" />}
                  <span className="flex-1 text-sm font-medium">{ch.title}</span>
                  <span className="text-[10px] text-white/30">{ch.isPreview ? `${vids.length} ویدیو` : "قفل"}</span>
                  {!locked && <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                </button>
                {isOpen && !locked && (
                  <div className="p-4 pt-0 space-y-4">
                    {vids.length === 0 && <p className="text-xs text-white/40">ویدیویی در این فصل نیست.</p>}
                    {vids.map((v: any, vi: number) => (
                      <div key={vi} className="space-y-1.5">
                        <p className="text-xs text-white/60">{v.title}</p>
                        <SecureVideoPlayer
                          src={v.videoUrl}
                          poster={v.coverUrl}
                          watermarkText={course.watermarkText}
                          watermarkColor={course.watermarkColor}
                          watermarkCount={course.watermarkCount}
                        />
                      </div>
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

      {buy && <PurchaseModal item={course} shop={shop} onClose={() => setBuy(false)} />}
    </div>
  );
}
