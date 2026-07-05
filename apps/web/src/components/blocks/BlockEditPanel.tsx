"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, Clock } from "lucide-react";
import { getBlockDef, type BlockType, type FieldDef } from "./block-types";
import { BrandLogo } from "./brand-icons";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  block: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
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

export function BlockEditPanel({ block, onSave, onClose }: Props) {
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
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const setValue = (path: string, value: any) => {
    setForm((prev) => setNestedValue(prev, path, value));
  };

  const getValue = (path: string) => getNestedValue(form, path) || "";

  const handleUpload = async (fieldKey: string, file: File) => {
    setUploading(fieldKey);
    try {
      const url = await uploadApi.image(file);
      setValue(fieldKey, url);
    } catch {
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    // Validate required fields up-front with a clear message per field.
    for (const field of def.fields as FieldDef[]) {
      if (field.required) {
        const v = getNestedValue(form, field.key);
        if (v === undefined || v === null || String(v).trim() === "") {
          toast.error(`«${field.label}» الزامی است`);
          return;
        }
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm bg-[#111122] border border-white/[0.08]
                      rounded-2xl overflow-hidden shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-lg">{def.icon}</span>
            <h3 className="font-bold text-white text-sm">ویرایش {def.label}</h3>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto scrollbar-hide">
          {def.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                {field.label}
                {field.required && <span className="text-red-400 mr-1">*</span>}
              </label>

              {field.type === "platform" ? (
                <div className="grid grid-cols-3 gap-2">
                  {field.options?.map((o) => {
                    const selected = getValue(field.key) === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setValue(field.key, o.value)}
                        className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all
                                    ${selected
                                      ? "border-orange-500/60 bg-orange-500/10"
                                      : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                        <BrandLogo platform={o.value} size={26} />
                        <span className="text-[11px] text-white/80">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : field.type === "emoji" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {field.presets?.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setValue(field.key, getValue(field.key) === em ? "" : em)}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all
                                    ${getValue(field.key) === em
                                      ? "border-orange-500/60 bg-orange-500/15"
                                      : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                        {em}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={getValue(field.key)}
                    onChange={(e) => setValue(field.key, e.target.value.slice(0, 2))}
                    placeholder="یا ایموجی دلخواه"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10
                               text-white text-sm text-center focus:outline-none focus:border-orange-500/50" />
                </div>
              ) : field.type === "select" ? (
                <select
                  value={getValue(field.key)}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10
                             text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all">
                  <option value="">انتخاب کنید</option>
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={getValue(field.key)}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10
                             text-white text-sm resize-none focus:outline-none
                             focus:border-orange-500/50 transition-all leading-relaxed"
                />
              ) : field.type === "image" ? (
                <div className="space-y-2">
                  {getValue(field.key) && (
                    <img src={getValue(field.key)} alt=""
                      className="w-full h-28 object-cover rounded-xl border border-white/10" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileRefs.current[field.key]?.click()}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                               border border-dashed border-white/15 text-gray-500 text-sm
                               hover:border-orange-500/40 hover:text-orange-400 transition-all">
                    {uploading === field.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploading === field.key ? "در حال آپلود..." : "آپلود تصویر"}
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[field.key] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(field.key, e.target.files[0])}
                  />
                </div>
              ) : (
                <input
                  type={field.type === "url" ? "url" : "text"}
                  value={getValue(field.key)}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  dir={field.type === "url" ? "ltr" : "rtl"}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10
                             text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all"
                />
              )}

              {field.hint && (
                <p className="mt-1 text-[10px] text-gray-500 leading-relaxed">{field.hint}</p>
              )}
            </div>
          ))}

          {/* Active toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <span className="text-xs text-gray-500">نمایش در صفحه</span>
            <button
              type="button"
              onClick={() => setValue("isActive", !form.isActive)}
              className={`w-10 h-5 rounded-full transition-all duration-200 relative
                          ${form.isActive ? "bg-orange-500" : "bg-white/10"}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all
                                ${form.isActive ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Schedule */}
          <div className="border-t border-white/[0.06] pt-2">
            <button type="button" onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-orange-400 transition-colors">
              <Clock className="w-3.5 h-3.5" />
              زمان‌بندی نمایش
              <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-md">اختیاری</span>
            </button>
            {showSchedule && (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">نمایش از تاریخ</label>
                  <input type="datetime-local" value={form.scheduleStart}
                    onChange={(e) => setValue("scheduleStart", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs
                               focus:outline-none focus:border-orange-500/50" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 mb-1">تا تاریخ</label>
                  <input type="datetime-local" value={form.scheduleEnd}
                    onChange={(e) => setValue("scheduleEnd", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs
                               focus:outline-none focus:border-orange-500/50" />
                </div>
                {(form.scheduleStart || form.scheduleEnd) && (
                  <button type="button" onClick={() => { setValue("scheduleStart", ""); setValue("scheduleEnd", ""); }}
                    className="text-[10px] text-red-400 hover:text-red-300">پاک کردن زمان‌بندی</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-white/[0.06]">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-white/10
                       hover:border-white/20 hover:text-gray-300 transition-all">
            انصراف
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                       bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold
                       transition-all disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}
