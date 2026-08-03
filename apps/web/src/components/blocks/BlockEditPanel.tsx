"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, Clock, Plus, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react";
import { getBlockDef, type BlockType, type FieldDef } from "./block-types";
import { BrandLogo } from "./brand-icons";
import { BIO_ICON_NAMES, BioIcon } from "./bio-icons";
import { JalaliDateTime } from "../JalaliDatePicker";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  block: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
  /**
   * Called on every keystroke with the in-progress form. The live editor uses
   * it to repaint the preview before anything is persisted; the standalone
   * modal omits it.
   */
  onChange?: (draft: Record<string, any>) => void;
  /** "modal" floats over the page; "inline" fills a column in the live editor. */
  variant?: "modal" | "inline";
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split(".").reduce((acc, k) => acc?.[k], obj);
}

function setNestedValue(obj: Record<string, any>, path: string, value: any): Record<string, any> {
  const keys = path.split(".");
  const result = { ...obj };
  let cur: any = result;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] || {}) };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return result;
}

/** `equals: ["*"]` means "any non-empty value" — used for follow-up fields. */
function fieldVisible(field: FieldDef, form: Record<string, any>): boolean {
  if (!field.showIf) return true;
  const v = getNestedValue(form, field.showIf.key);
  if (field.showIf.equals.includes("*")) return v !== undefined && v !== null && String(v).trim() !== "";
  return field.showIf.equals.includes(String(v ?? ""));
}

const LABEL = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5";

// ─── Icon picker ──────────────────────────────────────────────────────────────

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState("");
  const list = q ? BIO_ICON_NAMES.filter((n) => n.includes(q.toLowerCase())) : BIO_ICON_NAMES;
  return (
    <div className="space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجوی آیکون (انگلیسی)"
        dir="ltr"
        className="input-base !py-2 text-xs"
      />
      <div className="grid grid-cols-8 gap-1 max-h-28 overflow-y-auto scrollbar-hide p-1
                      rounded-xl bg-gray-50 dark:bg-white/[0.03]">
        {list.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(value === name ? "" : name)}
            className={`flex items-center justify-center h-8 rounded-lg border transition-all
                        ${value === name
                          ? "border-accent-500 bg-accent-500/15 text-accent-700"
                          : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"}`}
          >
            <BioIcon name={name} className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Single field ─────────────────────────────────────────────────────────────

function FieldInput({
  field, value, onChange, onUpload, uploading,
}: {
  field: FieldDef;
  value: any;
  onChange: (v: any) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const v = value ?? "";

  switch (field.type) {
    case "jdatetime":
      return <JalaliDateTime value={v} onChange={onChange} minToday />;

    case "platform":
      return (
        <div className="grid grid-cols-3 gap-2">
          {field.options?.map((o) => {
            const selected = v === o.value;
            return (
              <button key={o.value} type="button" onClick={() => onChange(o.value)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all
                            ${selected
                              ? "border-accent-500/60 bg-accent-500/10"
                              : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/25"}`}>
                <BrandLogo platform={o.value} size={26} />
                <span className="text-[11px] text-gray-700 dark:text-white/80">{o.label}</span>
              </button>
            );
          })}
        </div>
      );

    case "emoji":
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {field.presets?.map((em) => (
              <button key={em} type="button" aria-pressed={v === em}
                onClick={() => onChange(v === em ? "" : em)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all
                            ${v === em
                              ? "border-accent-500/60 bg-accent-500/15"
                              : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"}`}>
                {em}
              </button>
            ))}
          </div>
          <input type="text" value={v} onChange={(e) => onChange(e.target.value.slice(0, 2))}
            placeholder="یا ایموجی دلخواه" className="input-base !py-2 text-sm text-center" />
        </div>
      );

    case "lucide":
      return <IconPicker value={String(v)} onChange={onChange} />;

    case "color":
      return (
        <div className="flex items-center gap-2">
          <input type="color" value={v || "#0EA88A"} onChange={(e) => onChange(e.target.value)}
            aria-label={field.label}
            className="w-11 h-11 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent cursor-pointer" />
          <input type="text" value={v} onChange={(e) => onChange(e.target.value)}
            dir="ltr" placeholder="#0EA88A" className="input-base !py-2 text-sm" />
        </div>
      );

    case "toggle":
      return (
        <button type="button" role="switch" aria-checked={!!v} onClick={() => onChange(!v)}
          className={`w-11 h-6 rounded-full transition-all relative ${v ? "bg-accent-500" : "bg-gray-300 dark:bg-white/10"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${v ? "right-0.5" : "left-0.5"}`} />
        </button>
      );

    case "select":
      return (
        <select value={v} onChange={(e) => onChange(e.target.value)} className="input-base !py-2.5 text-sm">
          <option value="">انتخاب کنید</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );

    case "textarea":
      return (
        <textarea rows={3} value={v} onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder} className="input-base !py-2.5 text-sm resize-none leading-relaxed" />
      );

    case "number":
      return (
        <input type="number" inputMode="numeric" value={v}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={field.placeholder} dir="ltr" className="input-base !py-2.5 text-sm" />
      );

    case "image":
      return (
        <div className="space-y-2">
          {v && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={v} alt="" className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-white/10" />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 min-h-[2.75rem] rounded-xl
                         border border-dashed border-gray-300 dark:border-white/15
                         text-gray-500 dark:text-gray-400 text-sm
                         hover:border-accent-500/50 hover:text-accent-700 transition-all">
              {uploading ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Upload aria-hidden="true" className="w-4 h-4" />}
              {uploading ? "در حال آپلود..." : "آپلود تصویر"}
            </button>
            {v && (
              <button type="button" onClick={() => onChange("")} aria-label="حذف تصویر"
                className="min-h-[2.75rem] px-3 rounded-xl border border-gray-200 dark:border-white/10
                           text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 aria-hidden="true" className="w-4 h-4" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </div>
      );

    default:
      return (
        <input type={field.type === "url" ? "url" : "text"} value={v}
          onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder}
          dir={field.type === "url" ? "ltr" : "rtl"} className="input-base !py-2.5 text-sm" />
      );
  }
}

// ─── Repeater ─────────────────────────────────────────────────────────────────

function Repeater({
  field, rows, onChange, onUpload, uploadingKey,
}: {
  field: FieldDef;
  rows: any[];
  onChange: (rows: any[]) => void;
  onUpload: (rowIndex: number, subKey: string, file: File) => void;
  uploadingKey: string | null;
}) {
  // Rows collapse to a one-line summary so a 12-row price list stays
  // navigable; the newest row opens automatically after "add".
  const [open, setOpen] = useState<number | null>(rows.length ? 0 : null);
  const max = field.max ?? 20;

  const update = (i: number, key: string, value: any) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r));
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  const remove = (i: number) => {
    onChange(rows.filter((_, idx) => idx !== i));
    setOpen(null);
  };
  const add = () => {
    onChange([...rows, {}]);
    setOpen(rows.length);
  };

  const summary = (row: any, i: number) =>
    row.title || row.name || row.text || row.value || row.platform || `${field.itemLabel || "آیتم"} ${i + 1}`;

  return (
    <div className="space-y-2">
      {rows.map((row, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/[0.03] px-2 py-1.5">
              <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                className="flex-1 min-h-[2.25rem] text-right text-xs font-medium truncate text-gray-800 dark:text-gray-200">
                {summary(row, i)}
              </button>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                aria-label="انتقال به بالا"
                className="p-1.5 rounded-lg text-gray-400 hover:text-accent-700 disabled:opacity-30">
                <ChevronUp aria-hidden="true" className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1}
                aria-label="انتقال به پایین"
                className="p-1.5 rounded-lg text-gray-400 hover:text-accent-700 disabled:opacity-30">
                <ChevronDown aria-hidden="true" className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => remove(i)} aria-label={`حذف ${summary(row, i)}`}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500">
                <Trash2 aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>
            {isOpen && (
              <div className="p-3 space-y-3 border-t border-gray-200 dark:border-white/10">
                {(field.itemFields || []).map((sub) => (
                  <div key={sub.key}>
                    <label className={LABEL}>
                      {sub.label}
                      {sub.required && <span className="text-red-500 mr-1">*</span>}
                    </label>
                    <FieldInput
                      field={sub}
                      value={row[sub.key]}
                      onChange={(val) => update(i, sub.key, val)}
                      onUpload={(file) => onUpload(i, sub.key, file)}
                      uploading={uploadingKey === `${field.key}.${i}.${sub.key}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {rows.length < max ? (
        <button type="button" onClick={add}
          className="flex items-center justify-center gap-1.5 w-full min-h-[2.75rem] rounded-xl
                     border border-dashed border-gray-300 dark:border-white/15
                     text-sm text-gray-500 dark:text-gray-400
                     hover:border-accent-500/50 hover:text-accent-700 transition-all">
          <Plus aria-hidden="true" className="w-4 h-4" />
          افزودن {field.itemLabel || "آیتم"}
        </button>
      ) : (
        <p className="text-[11px] text-gray-500 text-center">حداکثر {max} مورد</p>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function BlockEditPanel({ block, onSave, onClose, onChange, variant = "modal" }: Props) {
  const def = getBlockDef(block.type as BlockType);
  const [form, setForm] = useState<Record<string, any>>({
    label: block.label || "",
    url: block.url || "",
    icon: block.icon || "",
    isActive: block.isActive ?? true,
    data: block.data || {},
    scheduleStart: block.scheduleStart ? new Date(block.scheduleStart).toISOString().slice(0, 16) : "",
    scheduleEnd: block.scheduleEnd ? new Date(block.scheduleEnd).toISOString().slice(0, 16) : "",
  });
  const [showSchedule, setShowSchedule] = useState(!!(block.scheduleStart || block.scheduleEnd));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Stream the draft upward so the live preview repaints as the seller types.
  // Ref-guarded so the first render doesn't fire a redundant update.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => { onChangeRef.current?.(form); }, [form]);

  const setValue = (path: string, value: any) => setForm((prev) => setNestedValue(prev, path, value));
  const getValue = (path: string) => getNestedValue(form, path);

  const handleUpload = async (fieldKey: string, file: File, apply: (url: string) => void) => {
    setUploading(fieldKey);
    try {
      apply(await uploadApi.image(file));
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    for (const field of def.fields as FieldDef[]) {
      if (!field.required || !fieldVisible(field, form)) continue;
      const v = getNestedValue(form, field.key);
      if (v === undefined || v === null || String(v).trim() === "") {
        toast.error(`«${field.label}» الزامی است`);
        return;
      }
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const visibleFields = def.fields.filter((f) => fieldVisible(f, form));

  const body = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg" aria-hidden="true">{def.icon}</span>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">ویرایش {def.label}</h3>
        </div>
        <button onClick={onClose} aria-label="بستن"
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white
                     hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <X aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>

      <div className={`p-4 space-y-4 overflow-y-auto scrollbar-hide ${variant === "modal" ? "max-h-[60vh]" : "flex-1"}`}>
        {visibleFields.map((field) => (
          <div key={field.key}>
            <label className={LABEL}>
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>

            {field.type === "repeat" ? (
              <Repeater
                field={field}
                rows={Array.isArray(getValue(field.key)) ? getValue(field.key) : []}
                onChange={(rows) => setValue(field.key, rows)}
                uploadingKey={uploading}
                onUpload={(i, subKey, file) =>
                  handleUpload(`${field.key}.${i}.${subKey}`, file, (url) => {
                    const rows = Array.isArray(getValue(field.key)) ? getValue(field.key) : [];
                    setValue(field.key, rows.map((r: any, idx: number) => (idx === i ? { ...r, [subKey]: url } : r)));
                  })
                }
              />
            ) : (
              <FieldInput
                field={field}
                value={getValue(field.key)}
                onChange={(val) => setValue(field.key, val)}
                uploading={uploading === field.key}
                onUpload={(file) => handleUpload(field.key, file, (url) => setValue(field.key, url))}
              />
            )}

            {field.hint && (
              <p className="mt-1 text-[10px] text-gray-500 leading-relaxed">{field.hint}</p>
            )}
          </div>
        ))}

        {/* Active toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/[0.06]">
          <span className="text-xs text-gray-600 dark:text-gray-400">نمایش در صفحه</span>
          <button type="button" role="switch" aria-checked={!!form.isActive}
            aria-label="نمایش این بلوک در صفحه"
            onClick={() => setValue("isActive", !form.isActive)}
            className={`w-11 h-6 rounded-full transition-all relative ${form.isActive ? "bg-accent-500" : "bg-gray-300 dark:bg-white/10"}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isActive ? "right-0.5" : "left-0.5"}`} />
          </button>
        </div>

        {/* Schedule */}
        <div className="border-t border-gray-200 dark:border-white/[0.06] pt-2">
          <button type="button" onClick={() => setShowSchedule(!showSchedule)} aria-expanded={showSchedule}
            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-accent-700 transition-colors">
            <Clock aria-hidden="true" className="w-3.5 h-3.5" />
            زمان‌بندی نمایش
            <span className="text-[10px] text-accent-700 bg-accent-500/10 px-1.5 py-0.5 rounded-md">اختیاری</span>
          </button>
          {showSchedule && (
            <div className="mt-3 space-y-2">
              <div>
                <label htmlFor="sched-start" className="block text-[10px] text-gray-500 mb-1">نمایش از تاریخ</label>
                <input id="sched-start" type="datetime-local" value={form.scheduleStart}
                  onChange={(e) => setValue("scheduleStart", e.target.value)}
                  className="input-base !py-2 text-xs" />
              </div>
              <div>
                <label htmlFor="sched-end" className="block text-[10px] text-gray-500 mb-1">تا تاریخ</label>
                <input id="sched-end" type="datetime-local" value={form.scheduleEnd}
                  onChange={(e) => setValue("scheduleEnd", e.target.value)}
                  className="input-base !py-2 text-xs" />
              </div>
              {(form.scheduleStart || form.scheduleEnd) && (
                <button type="button" onClick={() => { setValue("scheduleStart", ""); setValue("scheduleEnd", ""); }}
                  className="text-[10px] text-red-600 dark:text-red-400 hover:underline">پاک کردن زمان‌بندی</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 p-3 border-t border-gray-200 dark:border-white/[0.06]">
        <button onClick={onClose}
          className="flex-1 min-h-[2.75rem] rounded-xl text-sm text-gray-600 dark:text-gray-400
                     border border-gray-200 dark:border-white/10
                     hover:border-gray-300 dark:hover:border-white/20 transition-all">
          انصراف
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 !py-2.5 text-sm">
          {saving ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Check aria-hidden="true" className="w-4 h-4" />}
          ذخیره
        </button>
      </div>
    </>
  );

  if (variant === "inline") {
    return <div className="flex flex-col h-full glass-card overflow-hidden">{body}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`ویرایش ${def.label}`}
        className="relative z-10 w-full sm:max-w-sm bg-white dark:bg-[#111122]
                   border border-gray-200 dark:border-white/[0.08]
                   rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-fade-up
                   pb-[env(safe-area-inset-bottom)] sm:pb-0">
        {body}
      </div>
    </div>
  );
}
