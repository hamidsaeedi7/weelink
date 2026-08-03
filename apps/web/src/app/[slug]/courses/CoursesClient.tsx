"use client";

import { BookOpen, PlayCircle, Lock, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { resolveBioBackground } from "@/lib/bio-theme";

interface Course {
  id: string; title: string; description?: string; coverUrl?: string; price: string; isFree: boolean;
  chapters?: { id: string; title: string; videoUrl?: string }[];
}

const textStyle = { color: "var(--bio-text)" };
const secondaryStyle = { color: "var(--bio-text-secondary)" };

export default function CoursesClient({ slug, courses, shop }: { slug: string; courses: Course[]; shop: any }) {
  const primary = shop?.primaryColor || "#0EA88A";
  const theme = shop?.bioTheme || "modern";
  const mode = shop?.bioMode || "dark";
  const background = resolveBioBackground(shop, theme);

  return (
    <div
      data-bio-theme={theme}
      data-bio-mode={mode}
      className="min-h-screen py-8 px-4"
      style={{ background, fontFamily: `'${shop?.fontFamily || "Vazirmatn"}', Vazirmatn, sans-serif` }}>
      <div className="max-w-lg mx-auto space-y-5">
        <div className="relative text-center">
          <a href={`/${slug}`} title="بازگشت به فروشگاه"
            className="bio-card absolute right-0 top-0 p-2 transition-all"
            style={secondaryStyle}>
            <ArrowRight className="w-5 h-5" />
          </a>
          <h1 className="text-xl font-black flex items-center justify-center gap-2" style={textStyle}>
            <BookOpen className="w-5 h-5" style={{ color: primary }} /> دوره‌های آموزشی
          </h1>
          {shop?.name && <p className="text-sm mt-1" style={secondaryStyle}>{shop.name}</p>}
        </div>

        {courses.length === 0 ? (
          <p className="text-center py-16" style={secondaryStyle}>دوره‌ای برای فروش موجود نیست</p>
        ) : (
          <div className="space-y-4">
            {courses.map((c) => (
              <div key={c.id} className="bio-card overflow-hidden">
                {c.coverUrl
                  ? <img src={c.coverUrl} alt={c.title} className="w-full h-40 object-cover" />
                  : (
                    <div className="w-full h-40 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${primary}33, ${primary}0d)` }}>
                      <BookOpen className="w-10 h-10 opacity-60" style={{ color: primary }} />
                    </div>
                  )}
                <div className="p-4 space-y-3">
                  <h3 className="font-bold" style={textStyle}>{c.title}</h3>
                  {c.description && <p className="text-xs line-clamp-2" style={secondaryStyle}>{c.description}</p>}
                  {c.chapters && c.chapters.length > 0 && (
                    <div className="space-y-1.5">
                      {c.chapters.slice(0, 4).map((ch) => (
                        <div key={ch.id} className="flex items-center gap-2 text-xs" style={secondaryStyle}>
                          {ch.videoUrl ? <PlayCircle className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 opacity-40" />}
                          <span className="truncate">{ch.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--bio-card-border)" }}>
                    <span className="font-black" style={{ color: primary }}>{c.isFree ? "رایگان" : formatPrice(Number(c.price))}</span>
                    <a href={`/${slug}/course/${c.id}`}
                      className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all"
                      style={{ background: primary }}>
                      مشاهده دوره
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
