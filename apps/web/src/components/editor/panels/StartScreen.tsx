"use client";

import { useEffect, useState } from "react";
import { FileImage, LayoutTemplate, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { storyProjectsApi } from "@/lib/api";
import type { Project } from "@/lib/editor/types";

interface RecentProject {
  id: string;
  name: string;
  thumbnail?: string | null;
  updatedAt: string;
}

export type StartChoice = "product" | "template" | "blank";

/**
 * First thing a new seller sees, instead of a toolbar full of unexplained
 * icons. Deliberately four choices and no wizard — the spec's multi-step
 * onboarding would be slower than just starting, and every path here lands
 * in the editor in one click.
 */
export function StartScreen({
  onChoose,
  onOpenProject,
  onDismiss,
}: {
  onChoose: (choice: StartChoice) => void;
  onOpenProject: (doc: Project, id: string) => void;
  onDismiss: () => void;
}) {
  const [recent, setRecent] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    storyProjectsApi
      .getAll()
      .then((r: any) => setRecent(Array.isArray(r) ? r.slice(0, 4) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const open = async (id: string) => {
    setOpeningId(id);
    try {
      const full: any = await storyProjectsApi.getOne(id);
      if (full?.doc?.pages?.length) onOpenProject(full.doc as Project, id);
    } finally {
      setOpeningId(null);
    }
  };

  const CHOICES: { key: StartChoice; icon: any; title: string; desc: string }[] = [
    { key: "product", icon: Wand2, title: "استوری محصول", desc: "اطلاعات محصولت را بده، چند طرح آماده بگیر" },
    { key: "template", icon: LayoutTemplate, title: "از قالب آماده", desc: "۱۲ قالب فارسی برای مناسبت‌ها و فروش" },
    { key: "blank", icon: FileImage, title: "بوم خالی", desc: "از صفر شروع کن" },
  ];

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-gray-50 dark:bg-[#0B0B0F]">
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        <button
          onClick={onDismiss}
          aria-label="بستن"
          className="absolute top-4 left-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-7">
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-500/10 mb-3">
              <Sparkles className="w-6 h-6 text-accent-500" />
            </span>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">چی می‌خوای بسازی؟</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              هر کدام را بزنی، مستقیم وارد ویرایشگر می‌شوی و همه‌چیز قابل تغییر است.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CHOICES.map((c) => (
              <button
                key={c.key}
                onClick={() => onChoose(c.key)}
                className="group flex flex-col items-start gap-2 p-4 rounded-2xl text-right bg-white dark:bg-white/[0.03] border border-black/5 dark:border-white/5 hover:border-accent-500 hover:shadow-lg transition-all"
              >
                <span className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center group-hover:bg-accent-500 transition-colors">
                  <c.icon className="w-5 h-5 text-accent-500 group-hover:text-white transition-colors" />
                </span>
                <span className="text-sm font-black text-gray-900 dark:text-white">{c.title}</span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{c.desc}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
            </div>
          ) : recent.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xs font-bold text-gray-400 mb-2.5">ادامهٔ کارهای قبلی</h2>
              <div className="grid grid-cols-4 gap-2.5">
                {recent.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => open(p.id)}
                    disabled={openingId === p.id}
                    title={p.name}
                    className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-accent-500 transition-all bg-gray-100 dark:bg-white/5"
                    style={{ aspectRatio: "9/16" }}
                  >
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-400 px-1 text-center">{p.name}</span>
                    )}
                    {openingId === p.id && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 py-1 bg-black/60 text-[9px] font-bold text-white truncate px-1">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
