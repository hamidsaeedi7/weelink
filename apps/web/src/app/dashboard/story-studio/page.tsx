"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import {
  Type, ImagePlus, Shapes, Layers, Download, Undo2, Redo2, X,
  Square, Circle, Triangle, Star as StarIcon, Minus, Loader2,
  ZoomIn, ZoomOut, Maximize, SlidersHorizontal, Palette, Sparkles,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { CANVAS_PRESETS, createImage, createShape, createText } from "@/lib/editor/presets";
import type { ShapeKind } from "@/lib/editor/types";
import { PropertiesPanel } from "@/components/editor/panels/PropertiesPanel";
import { LayersPanel } from "@/components/editor/panels/LayersPanel";
import { PanelSection, ToolButton } from "@/components/editor/ui";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";

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

type MobileSheet = "properties" | "layers" | "shapes" | null;

export default function StoryStudioPage() {
  const doc = useEditor((s) => s.doc);
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

  const stageRef = useRef<Konva.Stage | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sheet, setSheet] = useState<MobileSheet>(null);

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
        const page = doc.pages[0];
        for (const id of selectedIds) {
          const o = page.objects.find((x) => x.id === id);
          if (o) patchObject(id, { x: o.x + dx, y: o.y + dy });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedIds, removeObjects, duplicateObjects, patchObject, beginTransaction, doc.pages]);

  // ── Actions ────────────────────────────────────────────────────────────
  const addTextObject = () => { addObject(createText()); setSheet("properties"); };

  const addShapeObject = (kind: ShapeKind) => { addObject(createShape(kind)); setSheet("properties"); };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadApi.image(file);
      const absolute = url.startsWith("http")
        ? url
        : `${process.env.NEXT_PUBLIC_API_URL || "https://api.weeelink.ir"}${url}`;
      addObject(createImage(absolute));
      toast.success("تصویر اضافه شد");
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  };

  const exportPng = async (scale = 1) => {
    const stage = stageRef.current;
    if (!stage) return;
    setExporting(true);
    try {
      // The stage is displayed at `zoom`, so 1/zoom brings it back to the
      // true 1080×1920 design resolution regardless of screen size.
      const url = stage.toDataURL({ pixelRatio: scale / zoom, mimeType: "image/png" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.name || "story"}-${doc.canvas.width}x${doc.canvas.height}${scale > 1 ? "@2x" : ""}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("تصویر دانلود شد");
    } catch {
      // Almost always a tainted canvas from a cross-origin image.
      toast.error("خطا در خروجی گرفتن — ممکنه یکی از تصاویر از دامنه‌ی دیگری باشه");
    } finally {
      setExporting(false);
    }
  };

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <div className="fixed inset-0 lg:relative lg:inset-auto flex flex-col h-[100dvh] lg:h-[calc(100vh-2rem)] bg-gray-50 dark:bg-[#0B0B0F] lg:rounded-2xl overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-2 px-3 py-2 border-b border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0">
        <span className="flex items-center gap-1.5 font-black text-sm text-gray-900 dark:text-white shrink-0">
          <Sparkles className="w-4 h-4 text-accent-500" />
          <span className="hidden sm:inline">استودیو استوری</span>
        </span>

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
          onClick={() => exportPng(1)}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent-500 hover:bg-accent-400 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">دانلود</span>
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop: left tool rail */}
        <aside className="hidden lg:flex flex-col gap-1 p-2 border-l border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] shrink-0">
          <ToolButton icon={Type} label="متن" onClick={addTextObject} />
          <ToolButton icon={ImagePlus} label="تصویر" onClick={() => fileRef.current?.click()} disabled={uploading} />
          <ToolButton icon={Shapes} label="شکل" onClick={() => setSheet(sheet === "shapes" ? null : "shapes")} active={sheet === "shapes"} />
        </aside>

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
        <div ref={viewportRef} className="flex-1 min-w-0 flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-black/40 relative">
          <div className="shadow-2xl rounded-lg overflow-hidden" style={{ lineHeight: 0 }}>
            <EditorCanvas stageRef={stageRef} />
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
        <ToolButton icon={Type} label="متن" onClick={addTextObject} />
        <ToolButton icon={ImagePlus} label="تصویر" onClick={() => fileRef.current?.click()} disabled={uploading} />
        <ToolButton icon={Shapes} label="شکل" onClick={() => setSheet("shapes")} />
        <ToolButton icon={selectedIds.length ? SlidersHorizontal : Palette} label={selectedIds.length ? "تنظیمات" : "پس‌زمینه"} onClick={() => setSheet("properties")} active={sheet === "properties"} />
        <ToolButton icon={Layers} label="لایه‌ها" onClick={() => setSheet("layers")} active={sheet === "layers"} />
      </nav>

      {/* ── Mobile: bottom sheet ── */}
      {sheet && (
        <div className="lg:hidden fixed inset-0 z-30 flex flex-col justify-end" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/40" aria-label="بستن" onClick={() => setSheet(null)} />
          <div className="relative max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white dark:bg-[#141419] p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {sheet === "layers" ? "لایه‌ها" : sheet === "shapes" ? "افزودن شکل" : selectedIds.length ? "تنظیمات عنصر" : "پس‌زمینه"}
              </span>
              <button onClick={() => setSheet(null)} aria-label="بستن" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {sheet === "layers" && <LayersPanel />}
            {sheet === "properties" && <PropertiesPanel />}
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
