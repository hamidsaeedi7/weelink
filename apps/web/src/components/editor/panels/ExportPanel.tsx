"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import {
  EXPORT_FORMATS, collectWarnings, collectImageWarnings,
  type ExportFormat, type ExportWarning,
} from "@/lib/editor/export";
import { SegmentedControl } from "../ui";

export interface ExportSettings {
  format: ExportFormat;
  scale: number;
  allPages: boolean;
  transparent: boolean;
}

export function ExportPanel({
  busy,
  onExport,
}: {
  busy: boolean;
  onExport: (settings: ExportSettings) => void;
}) {
  const doc = useEditor((s) => s.doc);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState(1);
  const [allPages, setAllPages] = useState(false);
  const [transparent, setTransparent] = useState(false);
  const [warnings, setWarnings] = useState<ExportWarning[]>([]);

  const multiPage = doc.pages.length > 1;
  // JPEG has no alpha channel at all, so offering it there would be a lie.
  const canTransparent = format === "png" || format === "webp";

  useEffect(() => {
    setWarnings(collectWarnings(doc));
    let alive = true;
    collectImageWarnings(doc).then((w) => {
      if (alive) setWarnings((prev) => [...prev.filter((p) => p.kind !== "low-res"), ...w]);
    });
    return () => { alive = false; };
  }, [doc]);

  const pageCount = allPages ? doc.pages.length : 1;
  const outW = doc.canvas.width * scale;
  const outH = doc.canvas.height * scale;
  const bundles = format !== "pdf" && pageCount > 1;

  return (
    <div className="space-y-4">
      <div>
        <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">فرمت</span>
        <div className="grid grid-cols-4 gap-1.5">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                format === f.key
                  ? "bg-accent-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">کیفیت</span>
        <SegmentedControl
          value={String(scale)}
          options={[
            { value: "1", label: "معمولی" },
            { value: "2", label: "۲ برابر (HD)" },
          ]}
          onChange={(v) => setScale(Number(v))}
        />
      </div>

      {multiPage && (
        <div>
          <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">صفحه‌ها</span>
          <SegmentedControl
            value={allPages ? "all" : "one"}
            options={[
              { value: "one", label: "صفحهٔ فعلی" },
              { value: "all", label: `همه (${doc.pages.length})` },
            ]}
            onChange={(v) => setAllPages(v === "all")}
          />
        </div>
      )}

      {canTransparent && (
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => setTransparent(e.target.checked)}
            className="w-4 h-4 accent-accent-500 rounded"
          />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">پس‌زمینهٔ شفاف</span>
        </label>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">{w.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-[11px] text-gray-400 leading-relaxed">
        خروجی: <span className="tabular-nums" dir="ltr">{outW}×{outH}</span>
        {" · "}
        {pageCount} صفحه
        {bundles && " · در یک فایل ZIP"}
        {format === "pdf" && " · یک فایل PDF"}
      </div>

      <button
        onClick={() => onExport({ format, scale, allPages, transparent: transparent && canTransparent })}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 bg-accent-500 hover:bg-accent-400 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {busy ? "در حال آماده‌سازی…" : "دانلود"}
      </button>
    </div>
  );
}
