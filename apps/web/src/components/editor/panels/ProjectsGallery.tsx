"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, FilePlus2, FolderOpen, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { storyProjectsApi } from "@/lib/api";
import { createProject } from "@/lib/editor/presets";
import type { Project } from "@/lib/editor/types";
import { EmptyHint } from "../ui";
import { toast } from "sonner";

interface ProjectSummary {
  id: string;
  name: string;
  thumbnail?: string | null;
  updatedAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "همین حالا";
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  return `${Math.round(h / 24)} روز پیش`;
}

export function ProjectsGallery({
  currentProjectId,
  onOpen,
  onNew,
}: {
  currentProjectId: string | null;
  onOpen: (doc: Project, id: string) => void;
  onNew: (doc: Project) => void;
}) {
  const [items, setItems] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await storyProjectsApi.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("خطا در دریافت پروژه‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    return q ? items.filter((i) => i.name.includes(q)) : items;
  }, [items, query]);

  const open = async (id: string) => {
    setOpeningId(id);
    try {
      const full: any = await storyProjectsApi.getOne(id);
      const doc = full?.doc;
      if (!doc?.pages?.length) {
        toast.error("این پروژه قابل باز شدن نیست");
        return;
      }
      onOpen(doc as Project, id);
    } catch {
      toast.error("خطا در باز کردن پروژه");
    } finally {
      setOpeningId(null);
    }
  };

  const duplicate = async (item: ProjectSummary) => {
    try {
      const full: any = await storyProjectsApi.getOne(item.id);
      await storyProjectsApi.create({
        name: `${item.name} (کپی)`,
        doc: full.doc,
        thumbnail: full.thumbnail ?? undefined,
      });
      toast.success("پروژه تکثیر شد");
      void load();
    } catch {
      toast.error("خطا در تکثیر پروژه");
    }
  };

  const rename = async (item: ProjectSummary) => {
    const name = window.prompt("نام جدید پروژه:", item.name);
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === item.name) return;
    // Optimistic — a rename failing is not worth blocking the UI for.
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, name: trimmed } : p)));
    try {
      await storyProjectsApi.update(item.id, { name: trimmed });
    } catch {
      toast.error("خطا در تغییر نام");
      void load();
    }
  };

  const remove = async (item: ProjectSummary) => {
    if (!window.confirm(`«${item.name}» حذف شود؟ این کار برگشت‌پذیر نیست.`)) return;
    try {
      await storyProjectsApi.remove(item.id);
      setItems((prev) => prev.filter((p) => p.id !== item.id));
      toast.success("پروژه حذف شد");
    } catch {
      toast.error("خطا در حذف پروژه");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی پروژه..."
            className="input-base w-full !py-2 !pr-9 text-xs"
          />
        </div>
        <button
          onClick={() => onNew(createProject("story"))}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent-500 hover:bg-accent-400 text-white text-xs font-bold rounded-xl transition-all shrink-0"
        >
          <FilePlus2 className="w-3.5 h-3.5" /> جدید
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyHint icon={FolderOpen}>
          {query ? "پروژه‌ای با این نام پیدا نشد." : "هنوز پروژه‌ای ذخیره نکرده‌ای. هر تغییری خودکار ذخیره می‌شود."}
        </EmptyHint>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {filtered.map((item) => {
            const isCurrent = item.id === currentProjectId;
            return (
              <div key={item.id} className="group">
                <button
                  onClick={() => open(item.id)}
                  disabled={openingId === item.id}
                  className={`relative w-full rounded-xl overflow-hidden border-2 transition-all bg-gray-100 dark:bg-white/5 ${
                    isCurrent ? "border-accent-500" : "border-transparent hover:border-accent-500/50"
                  }`}
                  style={{ aspectRatio: "9/16" }}
                >
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-gray-400" />
                    </span>
                  )}
                  {openingId === item.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-accent-500 text-[8px] font-bold text-white">
                      باز
                    </span>
                  )}
                </button>

                <div className="mt-1.5 flex items-center gap-0.5">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                    <span className="block text-[9px] text-gray-400">{timeAgo(item.updatedAt)}</span>
                  </span>
                  <button onClick={() => rename(item)} aria-label="تغییر نام" className="p-1 rounded text-gray-400 hover:text-accent-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => duplicate(item)} aria-label="تکثیر" className="p-1 rounded text-gray-400 hover:text-accent-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => remove(item)} aria-label="حذف" className="p-1 rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
