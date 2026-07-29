"use client";

import { useSyncExternalStore, type ReactNode } from "react";

/** Preset palette — brand green first, then neutrals and common story colours. */
export const SWATCHES = [
  "#14C7A5", "#0EA88A", "#0F172A", "#000000", "#FFFFFF",
  "#F97316", "#EF4444", "#EC4899", "#8B5CF6", "#3B82F6",
  "#FACC15", "#22C55E", "#64748B", "rgba(0,0,0,0.35)",
];

/**
 * The seller's own brand colours, shown ahead of the presets in every colour
 * picker once the brand kit loads.
 *
 * Deliberately a tiny module-level store rather than context: ColorField is
 * used deep inside several panels, and threading a provider through all of
 * them just to share one array would be far more plumbing than the feature
 * is worth.
 */
let brandColors: string[] = [];
const brandListeners = new Set<() => void>();

export function setBrandColors(colors: string[]) {
  const next = colors.filter(Boolean);
  if (next.join() === brandColors.join()) return;
  brandColors = next;
  brandListeners.forEach((l) => l());
}

function subscribeBrand(cb: () => void) {
  brandListeners.add(cb);
  return () => brandListeners.delete(cb);
}

function useBrandColors() {
  return useSyncExternalStore(
    subscribeBrand,
    () => brandColors,
    () => brandColors,
  );
}

export function PanelSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function LabeledSlider({
  label, value, min, max, step = 1, suffix, onChange, onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
        <span>{label}</span>
        <span className="tabular-nums text-gray-400">{value}{suffix}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        // Commit once per gesture, so a slider drag is a single undo step.
        onPointerDown={onCommit}
        onKeyDown={onCommit}
        className="w-full accent-accent-500"
      />
    </div>
  );
}

export function ColorField({
  label, value, onChange, onCommit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCommit?: () => void;
}) {
  const brand = useBrandColors();
  // Brand colours first, then presets, without duplicates.
  const swatches = [...brand, ...SWATCHES.filter((c) => !brand.includes(c))];
  return (
    <div>
      <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">{label}</span>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="color"
          // A color input can't express rgba(); fall back to black so the
          // native picker still opens instead of silently rejecting the value.
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => { onCommit?.(); onChange(e.target.value); }}
          className="w-9 h-9 rounded-lg border border-black/10 dark:border-white/10 bg-transparent cursor-pointer shrink-0"
          aria-label={label}
        />
        {swatches.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { onCommit?.(); onChange(c); }}
            aria-label={c}
            className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 ${
              value === c ? "border-accent-500 ring-2 ring-accent-500/40" : "border-black/10 dark:border-white/15"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          onClick={() => onChange(o.value)}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold transition-all ${
            value === o.value
              ? "bg-white dark:bg-white/10 text-accent-600 dark:text-accent-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ToolButton({
  icon: Icon, label, onClick, active, disabled, title,
}: {
  icon: any;
  label?: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={title ?? label}
      // 44px min touch target per accessibility requirement.
      className={`flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2.5 rounded-xl text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-accent-500/10 text-accent-600 dark:text-accent-400"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200"
      }`}
    >
      <Icon className="w-[18px] h-[18px]" />
      {label && <span className="leading-none">{label}</span>}
    </button>
  );
}

export function EmptyHint({ icon: Icon, children }: { icon: any; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
      <Icon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
      <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">{children}</p>
    </div>
  );
}
