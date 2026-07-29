"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import {
  Type, ImagePlus, Shapes, Layers, Download, Undo2, Redo2, X,
  Square, Circle, Triangle, Star as StarIcon, Minus, Loader2,
  ZoomIn, ZoomOut, Maximize, SlidersHorizontal, Palette, Sparkles, LayoutTemplate, FolderOpen, Wand2, Sticker, BadgeCheck,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { CANVAS_PRESETS, createImage, createShape, createText } from "@/lib/editor/presets";
import { projectFromTemplate, type StoryTemplate } from "@/lib/editor/templates";
import { useAutosave, type SaveStatus } from "@/lib/editor/useAutosave";
import type { ShapeKind } from "@/lib/editor/types";
import { exportImages } from "@/lib/editor/export";
import { ExportPanel, type ExportSettings } from "@/components/editor/panels/ExportPanel";
import { ProjectsGallery } from "@/components/editor/panels/ProjectsGallery";
import { ProductStoryWizard } from "@/components/editor/panels/ProductStoryWizard";
import { ElementsPicker } from "@/components/editor/panels/ElementsPicker";
import { BrandKitPanel } from "@/components/editor/panels/BrandKitPanel";
import { setBrandColors } from "@/components/editor/ui";
import { PropertiesPanel } from "@/components/editor/panels/PropertiesPanel";
import { LayersPanel } from "@/components/editor/panels/LayersPanel";
import { TemplatePicker } from "@/components/editor/panels/TemplatePicker";
import { PageStrip } from "@/components/editor/panels/PageStrip";
import { PanelSection, ToolButton } from "@/components/editor/ui";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: "",
  dirty: "ذخیره‌نشده",
  saving: "در حال ذخیره…",
  saved: "ذخیره شد",
  error: "ذخیره ناموفق — نسخهٔ محلی حفظ شد",
};

// Konva touches window at import time, so it can never be server-rendered.
const EditorCanvas = dynamic(
  () => import("@/components/editor/EditorCanvas").then((m) => m.EditorCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
      </div>
    ),
  },
);

const SHAPES: { kind: ShapeKind; icon: any; label: string }[] = [
  { kind: "rect", icon: Square, label: "مربع" },
  { kind: "ellipse", icon: Circle, label: "دایره" },
  { kind: "triangle", icon: Triangle, label: "مثلث" },
  { kind: "star", icon: StarIcon, label: "ستاره" },
  { kind: "line", icon: Minus, label: "خط" },
];

type MobileSheet = "properties" | "layers" | "shapes" | "templates" | "export" | "projects" | "product" | "elements" | "brand" | null;

export default function StoryStudioPage() {
  const doc = useEditor((s) => s.doc);
  const activePageId = useEditor((s) => s.activePageId);
  const zoom = useEditor((s) => s.zoom);
  const setZoom = useEditor((s) => s.setZoom);
  const selectedIds = useEditor((s) => s.selectedIds);
  const addObject = useEditor((s) => s.addObject);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const past = useEditor((s) => s.past);
  const future = useEditor((s) => s.future);
  const removeObjects = useEditor((s) => s.removeObjects);
  const duplicateObjects = useEditor((s) => s.duplicateObjects);
  const patchObject = useEditor((s) => s.patchObject);
  const beginTransaction = useEditor((s) => s.beginTransaction);
  const renameProject = useEditor((s) => s.renameProject);
  const addObjects = useEditor((s) => s.addObjects);
  const patchAllText = useEditor((s) => s.patchAllText);

  const stageRef = useRef<Konva.Stage | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState<MobileSheet>(null);

  // A small thumbnail for the project list. Capped hard — this rides along
  // with every autosave, so it must stay far below the payload limit.
  const getThumbnail = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    try {
      return stage.toDataURL({ pixelRatio: 160 / (doc.canvas.width * zoom), mimeType: "image/jpeg", quality: 0.5 });
    } catch {
      return undefined; // tainted canvas — a missing thumbnail must not block saving
    }
  }, [doc.canvas.width, zoom]);

  const { projectId, status: saveStatus, saveNow, openProject, startNew, recovered } = useAutosave({ getThumbnail });
  const setActivePage = useEditor((s) => s.setActivePage);
  // Export must repaint the stage without editing chrome before capturing.
  const [exportMode, setExportMode] = useState<{ transparent: boolean } | null>(null);

  // fitZoom is defined below; a ref lets callers above it stay in source
  // order without a forward-reference error.
  const fitZoomRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (recovered) toast.success("نسخهٔ ذخیره‌نشده بازیابی شد");
  }, [recovered]);

  const applyTemplate = (tpl: StoryTemplate) => {
    startNew(projectFromTemplate(tpl));
    setSheet(null);
    setTimeout(fitZoomRef.current, 0);
    toast.success(`قالب «${tpl.label}» اعمال شد`);
  };

  // ── Fit-to-viewport zoom ───────────────────────────────────────────────
  // The design is authored at 1080×1920 but must be visible on a phone, so
  // the canvas is scaled to whatever space the viewport actually has.
  const fitZoom = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const pad = 32;
    const z = Math.min(
      (el.clientWidth - pad) / doc.canvas.width,
      (el.clientHeight - pad) / doc.canvas.height,
    );
    setZoom(Math.max(0.05, z));
  }, [doc.canvas.width, doc.canvas.height, setZoom]);
  fitZoomRef.current = fitZoom;

  useEffect(() => {
    fitZoom();
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(fitZoom);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitZoom]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      // Never hijack keys while the user is typing into a field.
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const meta = e.ctrlKey || e.metaKey;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateObjects(selectedIds);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
        e.preventDefault();
        removeObjects(selectedIds);
        return;
      }
      if (e.key.startsWith("Arrow") && selectedIds.length) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 2;
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
        beginTransaction();
        // Must be the ACTIVE page — pages[0] silently nudged nothing once
        // the user moved to a second page.
        const page = doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0];
        for (const id of selectedIds) {
          const o = page.objects.find((x) => x.id === id);
          if (o) patchObject(id, { x: o.x + dx, y: o.y + dy });
        }
      }
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedIds, removeObjects, duplicateObjects, patchObject, beginTransaction, doc.pages, activePageId, saveNow]);

  // ── Actions ────────────────────────────────────────────────────────────
  const addTextObject = () => { addObject(createText()); setSheet("properties"); };

  const addShapeObject = (kind: ShapeKind) => { addObject(createShape(kind)); setSheet("properties"); };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadApi.image(file);
      // Keep the site-relative path. api.weeelink.ir does NOT serve /uploads —
      // only the web origin does, via the Next rewrite — so rewriting it onto
      // the API origin produces a broken image. Staying same-origin also keeps
      // the canvas untainted so export still works.
      addObject(createImage(url));
      toast.success("تصویر اضافه شد");
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  };

  const runExport = async (settings: ExportSettings) => {
    const stage = stageRef.current;
    if (!stage) return;
    setExporting(true);
    // Hide safe-zone bands / transformer (and optionally the background)
    // BEFORE capturing, then let React paint once.
    setExportMode({ transparent: settings.transparent });
    try {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const pages = settings.allPages
        ? doc.pages
        : [doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0]];
      await exportImages(
        { stage, zoom, project: doc, setActivePage, activePageId },
        settings.format,
        settings.scale,
        pages,
        doc.name,
      );
      toast.success("خروجی آماده شد");
      setSheet(null);
    } catch {
      // Almost always a tainted canvas from a cross-origin image.
      toast.error("خطا در خروجی گرفتن — ممکنه یکی از تصاویر از دامنه‌ی دیگری باشه");
    } finally {
      setExportMode(null);
      setExporting(false);
    }
  };

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <div className="fixed inset-0 lg:relative lg:inset-auto flex flex-col h-[100dvh] lg:h-[calc(100vh-2rem)] bg-gray-50 dark:bg-[#0B0B0F] lg:rounded-2xl overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0">
        <Sparkles className="w-4 h-4 text-accent-500 shrink-0" />

        <input
          value={doc.name}
          onChange={(e) => renameProject(e.target.value)}
          aria-label="نام پروژه"
          className="min-w-0 w-[110px] sm:w-[170px] bg-transparent text-sm font-black text-gray-900 dark:text-white outline-none rounded-lg px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-white/5 focus:bg-gray-100 dark:focus:bg-white/5 transition-colors"
        />

        {saveStatus !== "idle" && (
          <span
            className={`text-[10px] shrink-0 hidden sm:inline ${
              saveStatus === "error" ? "text-red-500" : "text-gray-400"
            }`}
          >
            {SAVE_LABEL[saveStatus]}
          </span>
        )}

        <select
          value={doc.presetKey}
          onChange={(e) => {
            const p = CANVAS_PRESETS.find((c) => c.key === e.target.value);
            if (!p) return;
            beginTransaction();
            useEditor.setState((s) => ({
              doc: { ...s.doc, presetKey: p.key, canvas: { width: p.width, height: p.height } },
            }));
            setTimeout(fitZoom, 0);
          }}
          className="input-base !py-1.5 !px-2 text-xs max-w-[150px] hidden sm:block"
        >
          {CANVAS_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button onClick={undo} disabled={!canUndo} aria-label="واگرد" title="واگرد (Ctrl+Z)"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={redo} disabled={!canRedo} aria-label="ازنو" title="ازنو (Ctrl+Shift+Z)"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30">
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="hidden lg:flex items-center gap-1 mx-1">
          <button onClick={() => setZoom(zoom - 0.1)} aria-label="کوچک‌نمایی" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] tabular-nums text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.1)} aria-label="بزرگ‌نمایی" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={fitZoom} aria-label="اندازه‌ی مناسب" title="جا دادن در صفحه" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setSheet("projects")}
          aria-label="پروژه‌ها"
          title="پروژه‌های من"
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSheet("export")}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent-500 hover:bg-accent-400 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">خروجی</span>
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop: left tool rail */}
        <aside className="hidden lg:flex flex-col gap-1 p-2 border-l border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0">
          <ToolButton icon={Wand2} label="محصول" onClick={() => setSheet("product")} active={sheet === "product"} />
          <ToolButton icon={LayoutTemplate} label="قالب" onClick={() => setSheet(sheet === "templates" ? null : "templates")} active={sheet === "templates"} />
          <ToolButton icon={Type} label="متن" onClick={addTextObject} />
          <ToolButton icon={ImagePlus} label="تصویر" onClick={() => fileRef.current?.click()} disabled={uploading} />
          <ToolButton icon={Shapes} label="شکل" onClick={() => setSheet(sheet === "shapes" ? null : "shapes")} active={sheet === "shapes"} />
          <ToolButton icon={Sticker} label="عناصر" onClick={() => setSheet("elements")} active={sheet === "elements"} />
          <ToolButton icon={BadgeCheck} label="برند" onClick={() => setSheet("brand")} active={sheet === "brand"} />
        </aside>

        {/* Desktop templates flyout */}
        {sheet === "templates" && (
          <div className="hidden lg:block absolute right-16 top-16 z-20 w-[340px] max-h-[70vh] overflow-y-auto p-3 rounded-2xl glass-chrome shadow-xl">
            <TemplatePicker onApply={applyTemplate} />
          </div>
        )}

        {/* Desktop shape flyout */}
        {sheet === "shapes" && (
          <div className="hidden lg:block absolute right-16 top-16 z-20 p-2 rounded-2xl glass-chrome shadow-xl">
            <div className="grid grid-cols-5 gap-1">
              {SHAPES.map((s) => (
                <ToolButton key={s.kind} icon={s.icon} label={s.label} onClick={() => { addShapeObject(s.kind); setSheet(null); }} />
              ))}
            </div>
          </div>
        )}

        {/* Canvas viewport */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div ref={viewportRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-black/40 relative">
            <div className="shadow-2xl rounded-lg overflow-hidden" style={{ lineHeight: 0 }}>
              <EditorCanvas
                stageRef={stageRef}
                exporting={!!exportMode}
                transparentBg={!!exportMode?.transparent}
              />
            </div>
          </div>
          {/* Page navigator sits under the canvas on both breakpoints */}
          <div className="border-t border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0">
            <PageStrip />
          </div>
        </div>

        {/* Desktop: right properties + layers */}
        <aside className="hidden lg:flex flex-col w-[300px] shrink-0 border-r border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] overflow-y-auto">
          <div className="p-4 space-y-6">
            <PropertiesPanel />
            <div className="pt-4 border-t border-black/5 dark:border-white/5">
              <PanelSection title="لایه‌ها"><LayersPanel /></PanelSection>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Mobile: bottom toolbar ── */}
      <nav className="lg:hidden flex items-center justify-around gap-1 px-2 py-2 border-t border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.03] shrink-0">
        <ToolButton icon={Wand2} label="محصول" onClick={() => setSheet("product")} active={sheet === "product"} />
        <ToolButton icon={LayoutTemplate} label="قالب" onClick={() => setSheet("templates")} active={sheet === "templates"} />
        <ToolButton icon={Type} label="متن" onClick={addTextObject} />
        <ToolButton icon={ImagePlus} label="تصویر" onClick={() => fileRef.current?.click()} disabled={uploading} />
        <ToolButton icon={Shapes} label="شکل" onClick={() => setSheet("shapes")} />
        <ToolButton icon={Sticker} label="عناصر" onClick={() => setSheet("elements")} active={sheet === "elements"} />
        <ToolButton icon={selectedIds.length ? SlidersHorizontal : Palette} label={selectedIds.length ? "تنظیمات" : "پس‌زمینه"} onClick={() => setSheet("properties")} active={sheet === "properties"} />
        <ToolButton icon={Layers} label="لایه‌ها" onClick={() => setSheet("layers")} active={sheet === "layers"} />
      </nav>

      {/* ── Sheet ── Mobile always; on desktop only for panels that have no
           dedicated rail slot (export, projects), so they work at both sizes. */}
      {sheet && (
        <div
          className={`fixed inset-0 z-30 flex flex-col justify-end ${
            ["export", "projects", "product", "elements", "brand"].includes(sheet) ? "" : "lg:hidden"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <button className="absolute inset-0 bg-black/40" aria-label="بستن" onClick={() => setSheet(null)} />
          <div className="relative max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-[#141419] p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200 lg:mx-auto lg:mb-auto lg:mt-[8vh] lg:max-w-2xl lg:rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {sheet === "layers" ? "لایه‌ها"
                  : sheet === "shapes" ? "افزودن شکل"
                  : sheet === "templates" ? "قالب‌های آماده"
                  : sheet === "export" ? "خروجی گرفتن"
                  : sheet === "projects" ? "پروژه‌های من"
                  : sheet === "product" ? "ساخت سریع استوری محصول"
                  : sheet === "elements" ? "عناصر آماده"
                  : sheet === "brand" ? "هویت برند"
                  : selectedIds.length ? "تنظیمات عنصر" : "پس‌زمینه"}
              </span>
              <button onClick={() => setSheet(null)} aria-label="بستن" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sheet === "layers" && <LayersPanel />}
            {sheet === "properties" && <PropertiesPanel />}
            {sheet === "templates" && <TemplatePicker onApply={applyTemplate} />}
            {sheet === "export" && <ExportPanel busy={exporting} onExport={runExport} />}
            {sheet === "elements" && (
              <ElementsPicker onAdd={(objs) => { addObjects(objs); setSheet(null); }} />
            )}
            {sheet === "brand" && (
              <BrandKitPanel
                onAdd={(objs) => { addObjects(objs); setSheet(null); }}
                onApplyFont={(f) => patchAllText({ fontFamily: f } as any)}
                onKitLoaded={(kit) => setBrandColors(kit.colors ?? [])}
              />
            )}
            {sheet === "product" && (
              <ProductStoryWizard
                onPick={(project) => {
                  startNew(project);
                  setSheet(null);
                  setTimeout(fitZoomRef.current, 0);
                  toast.success("استوری ساخته شد — حالا می‌تونی ویرایشش کنی");
                }}
              />
            )}
            {sheet === "projects" && (
              <ProjectsGallery
                currentProjectId={projectId}
                onOpen={(d, id) => {
                  openProject(d, id);
                  setSheet(null);
                  setTimeout(fitZoomRef.current, 0);
                  toast.success("پروژه باز شد");
                }}
                onNew={(d) => {
                  startNew(d);
                  setSheet(null);
                  setTimeout(fitZoomRef.current, 0);
                }}
              />
            )}
            {sheet === "shapes" && (
              <div className="grid grid-cols-5 gap-2">
                {SHAPES.map((s) => (
                  <ToolButton key={s.kind} icon={s.icon} label={s.label} onClick={() => { addShapeObject(s.kind); setSheet("properties"); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
    </div>
  );
}
