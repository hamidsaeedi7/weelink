"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Play, Sparkles, Video } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { ANIMATION_OPTIONS, pageDuration, staggerAnimation, totalDuration } from "@/lib/editor/animation";
import { DEFAULT_PAGE_DURATION, type AnimationType } from "@/lib/editor/types";
import { detectVideoSupport } from "@/lib/editor/video";
import { LabeledSlider, PanelSection, ProLock } from "../ui";

export interface VideoExportSettings {
  fps: number;
  allPages: boolean;
}

export function AnimationPanel({
  onPreview,
  onExportVideo,
  recording,
  progress,
  isPro,
}: {
  onPreview: () => void;
  onExportVideo: (s: VideoExportSettings) => void;
  recording: boolean;
  progress: number;
  isPro: boolean;
}) {
  const doc = useEditor((s) => s.doc);
  const activePageId = useEditor((s) => s.activePageId);
  const beginTransaction = useEditor((s) => s.beginTransaction);
  const patchObject = useEditor((s) => s.patchObject);
  const setPageDuration = useEditor((s) => s.setPageDuration);

  const [fps, setFps] = useState(25);
  const [allPages, setAllPages] = useState(false);

  const page = doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0];
  const support = useMemo(() => detectVideoSupport(), []);

  const applyStagger = (type: AnimationType) => {
    beginTransaction();
    const map = staggerAnimation(page.objects, type);
    for (const [id, anim] of Object.entries(map)) patchObject(id, { animation: anim } as any);
  };

  const seconds = allPages ? totalDuration(doc.pages) : pageDuration(page);
  const animatedCount = page.objects.filter((o) => o.animation && o.animation.type !== "none").length;

  if (!isPro) return <ProLock feature="انیمیشن و خروجی ویدیو" />;

  return (
    <div className="space-y-4">
      <PanelSection title="انیمیشن سریع">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          یک افکت را روی همهٔ عناصر این صفحه اعمال می‌کند، با تأخیر پلکانی — سریع‌ترین راه برای اینکه طرح ثابت، جاندار به نظر برسد.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {ANIMATION_OPTIONS.filter((o) => o.key !== "none").slice(0, 6).map((o) => (
            <button
              key={o.key}
              onClick={() => applyStagger(o.key)}
              className="py-2 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-accent-500 hover:text-white transition-all"
            >
              {o.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => applyStagger("none")}
          className="w-full py-2 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          حذف انیمیشن همه
        </button>
        <p className="text-[11px] text-gray-400">
          {animatedCount > 0 ? `${animatedCount} عنصر انیمیشن دارد` : "هیچ عنصری انیمیشن ندارد"}
        </p>
      </PanelSection>

      <PanelSection title="زمان صفحه">
        <LabeledSlider
          label="مدت نمایش" suffix="ث" min={2} max={15} step={0.5}
          value={page.duration ?? DEFAULT_PAGE_DURATION}
          onCommit={beginTransaction}
          onChange={(v) => setPageDuration(page.id, v)}
        />
        <button
          onClick={onPreview}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all"
        >
          <Play className="w-3.5 h-3.5" /> پیش‌نمایش
        </button>
      </PanelSection>

      <PanelSection title="خروجی ویدیو">
        {!support.supported ? (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
              مرورگر شما ضبط ویدیو را پشتیبانی نمی‌کند. با کروم یا اج جدید امتحان کن.
            </p>
          </div>
        ) : (
          <>
            {!support.instagramReady && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
                  این مرورگر فقط WebM می‌سازد و اینستاگرام WebM قبول نمی‌کند. برای خروجی MP4 از کروم دسکتاپ جدید استفاده کن، یا فایل را جداگانه تبدیل کن.
                </p>
              </div>
            )}

            {doc.pages.length > 1 && (
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allPages}
                  onChange={(e) => setAllPages(e.target.checked)}
                  className="w-4 h-4 accent-accent-500 rounded"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  همهٔ صفحه‌ها ({doc.pages.length})
                </span>
              </label>
            )}

            <LabeledSlider label="فریم بر ثانیه" min={12} max={30} step={1} value={fps} onChange={setFps} />

            <p className="text-[11px] text-gray-400 leading-relaxed">
              مدت: <span className="tabular-nums">{seconds.toFixed(1)}</span> ثانیه · فرمت{" "}
              <span dir="ltr">{support.extension.toUpperCase()}</span>
              {" · "}ضبط در زمان واقعی انجام می‌شود، پس همین‌قدر طول می‌کشد.
            </p>

            {recording && (
              <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-accent-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}

            <button
              onClick={() => onExportVideo({ fps, allPages })}
              disabled={recording}
              className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
            >
              {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {recording ? `در حال ضبط… ${Math.round(progress * 100)}٪` : "ضبط ویدیو"}
            </button>
          </>
        )}
      </PanelSection>
    </div>
  );
}
