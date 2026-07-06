"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Loader2, PlayCircle, Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PurchaseModal } from "../files/page";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Course {
  id: string; title: string; description?: string; coverUrl?: string; price: string; isFree: boolean;
  chapters?: { id: string; title: string; videoUrl?: string }[];
}

export default function PublicCoursesPage() {
  const slug = useParams().slug as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buy, setBuy] = useState<Course | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/courses`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/api/v1/shops/${slug}`).then((r) => r.json()).catch(() => null),
    ]).then(([c, s]) => {
      setCourses((c?.data ?? c ?? []) as Course[]);
      setShop(s?.data ?? s);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-black flex items-center justify-center gap-2"><BookOpen className="w-5 h-5 text-orange-500" /> دوره‌های آموزشی</h1>
          {shop?.name && <p className="text-sm text-white/50 mt-1">{shop.name}</p>}
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-white/40 py-16">دوره‌ای برای فروش موجود نیست</p>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
                {c.coverUrl
                  ? <img src={c.coverUrl} alt={c.title} className="w-full h-40 object-cover" />
                  : <div className="w-full h-40 bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center"><BookOpen className="w-10 h-10 text-orange-400/60" /></div>}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold">{c.title}</h3>
                  {c.description && <p className="text-xs text-white/50 line-clamp-2">{c.description}</p>}
                  {c.chapters && c.chapters.length > 0 && (
                    <div className="space-y-1.5">
                      {c.chapters.slice(0, 4).map((ch) => (
                        <div key={ch.id} className="flex items-center gap-2 text-xs text-white/60">
                          {ch.videoUrl ? <PlayCircle className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-white/30" />}
                          <span className="truncate">{ch.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="font-black text-orange-500">{c.isFree ? "رایگان" : formatPrice(Number(c.price))}</span>
                    <button onClick={() => setBuy(c)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-sm font-bold transition-all">
                      {c.isFree ? "شروع دوره" : "خرید دوره"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {buy && <PurchaseModal item={buy} shop={shop} onClose={() => setBuy(null)} />}
    </div>
  );
}
