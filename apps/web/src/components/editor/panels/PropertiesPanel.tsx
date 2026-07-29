"use client";

import {
  AlignCenter, AlignLeft, AlignRight, MousePointerSquareDashed,
  Trash2, Copy, Lock, Unlock, Eye, EyeOff, BringToFront, SendToBack,
  FlipHorizontal, FlipVertical, RotateCw,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { EDITOR_FONTS } from "@/lib/editor/presets";
import { DEFAULT_CROP, NEUTRAL_FILTERS, isImage, isShape, isText, type Background } from "@/lib/editor/types";
import { ColorField, EmptyHint, LabeledSlider, PanelSection, SegmentedControl, ToolButton } from "../ui";

/**
 * Contextual properties. Deliberately shared between the desktop right panel
 * and the mobile bottom sheet — the controls a user needs for a selected
 * object are identical; only the container differs.
 */
export function PropertiesPanel() {
  const selectedIds = useEditor((s) => s.selectedIds);
  const doc = useEditor((s) => s.doc);
  const activePageId = useEditor((s) => s.activePageId);
  const patchObject = useEditor((s) => s.patchObject);
  const beginTransaction = useEditor((s) => s.beginTransaction);
  const removeObjects = useEditor((s) => s.removeObjects);
  const duplicateObjects = useEditor((s) => s.duplicateObjects);
  const reorder = useEditor((s) => s.reorder);
  const setBackground = useEditor((s) => s.setBackground);

  const page = doc.pages.find((p) => p.id === activePageId) ?? doc.pages[0];
  const obj = page.objects.find((o) => o.id === selectedIds[0]);

  // Nothing selected → the canvas background is the sensible thing to edit.
  if (!obj) {
    const bg = page.background;
    return (
      <div className="space-y-5">
        <PanelSection title="پس‌زمینه">
          <SegmentedControl<Background["type"]>
            value={bg.type}
            options={[
              { value: "solid", label: "ساده" },
              { value: "gradient", label: "گرادیان" },
            ]}
            onChange={(t) =>
              setBackground(
                t === "solid"
                  ? { type: "solid", color: bg.type === "gradient" ? bg.from : "#0F172A" }
                  : { type: "gradient", from: bg.type === "solid" ? bg.color : "#0F172A", to: "#14C7A5", angle: 135 },
              )
            }
          />
          {bg.type === "solid" && (
            <ColorField label="رنگ" value={bg.color} onChange={(c) => setBackground({ type: "solid", color: c })} />
          )}
          {bg.type === "gradient" && (
            <>
              <ColorField label="رنگ اول" value={bg.from} onChange={(c) => setBackground({ ...bg, from: c })} />
              <ColorField label="رنگ دوم" value={bg.to} onChange={(c) => setBackground({ ...bg, to: c })} />
              <LabeledSlider
                label="زاویه" suffix="°" min={0} max={360} value={bg.angle}
                onChange={(v) => setBackground({ ...bg, angle: v })}
              />
            </>
          )}
        </PanelSection>

        <EmptyHint icon={MousePointerSquareDashed}>
          یک عنصر را روی بوم انتخاب کن تا تنظیماتش اینجا نمایش داده شود.
        </EmptyHint>
      </div>
    );
  }

  const patch = (p: any) => patchObject(obj.id, p);
  const commit = () => beginTransaction();

  return (
    <div className="space-y-5">
      {/* Object-level actions */}
      <div className="flex items-center gap-1 flex-wrap">
        <ToolButton icon={Copy} title="تکثیر" onClick={() => duplicateObjects([obj.id])} />
        <ToolButton icon={BringToFront} title="آوردن به جلو" onClick={() => reorder(obj.id, "front")} />
        <ToolButton icon={SendToBack} title="بردن به عقب" onClick={() => reorder(obj.id, "back")} />
        <ToolButton
          icon={obj.locked ? Lock : Unlock}
          title={obj.locked ? "باز کردن قفل" : "قفل کردن"}
          active={obj.locked}
          onClick={() => { commit(); patch({ locked: !obj.locked }); }}
        />
        <ToolButton
          icon={obj.visible ? Eye : EyeOff}
          title={obj.visible ? "مخفی کردن" : "نمایش"}
          onClick={() => { commit(); patch({ visible: !obj.visible }); }}
        />
        <ToolButton icon={Trash2} title="حذف" onClick={() => removeObjects([obj.id])} />
      </div>

      {isText(obj) && (
        <>
          <PanelSection title="متن">
            <textarea
              value={obj.text}
              onChange={(e) => patch({ text: e.target.value })}
              onFocus={commit}
              rows={3}
              className="input-base w-full resize-none"
              placeholder="متن..."
            />
          </PanelSection>

          <PanelSection title="تایپوگرافی">
            <select
              value={obj.fontFamily}
              onChange={(e) => { commit(); patch({ fontFamily: e.target.value }); }}
              className="input-base w-full"
              style={{ fontFamily: obj.fontFamily }}
            >
              <optgroup label="فارسی">
                {EDITOR_FONTS.filter((f) => f.group === "fa").map((f) => (
                  <option key={f.key} value={f.key} style={{ fontFamily: f.key }}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="English">
                {EDITOR_FONTS.filter((f) => f.group === "en").map((f) => (
                  <option key={f.key} value={f.key} style={{ fontFamily: f.key }}>{f.label}</option>
                ))}
              </optgroup>
            </select>

            <SegmentedControl
              value={String(obj.fontWeight)}
              options={[{ value: "400", label: "معمولی" }, { value: "700", label: "ضخیم" }]}
              onChange={(v) => { commit(); patch({ fontWeight: Number(v) }); }}
            />

            <SegmentedControl
              value={obj.align}
              options={[
                { value: "right", label: <AlignRight className="w-4 h-4" />, title: "راست‌چین" },
                { value: "center", label: <AlignCenter className="w-4 h-4" />, title: "وسط‌چین" },
                { value: "left", label: <AlignLeft className="w-4 h-4" />, title: "چپ‌چین" },
              ]}
              onChange={(v) => { commit(); patch({ align: v }); }}
            />

            <SegmentedControl
              value={obj.direction}
              options={[
                { value: "rtl", label: "راست‌به‌چپ" },
                { value: "ltr", label: "چپ‌به‌راست" },
              ]}
              onChange={(v) => { commit(); patch({ direction: v }); }}
            />

            <LabeledSlider label="اندازه" suffix="px" min={16} max={220} value={obj.fontSize} onCommit={commit} onChange={(v) => patch({ fontSize: v })} />
            <LabeledSlider label="فاصله خطوط" min={0.8} max={2.5} step={0.05} value={obj.lineHeight} onCommit={commit} onChange={(v) => patch({ lineHeight: v })} />
            <LabeledSlider label="فاصله حروف" min={-5} max={30} value={obj.letterSpacing} onCommit={commit} onChange={(v) => patch({ letterSpacing: v })} />
            <ColorField label="رنگ متن" value={obj.fill} onCommit={commit} onChange={(c) => patch({ fill: c })} />
          </PanelSection>
        </>
      )}

      {isText(obj) && (
        <PanelSection title="افکت متن">
          {/* Gradient replaces the flat fill entirely, so it is a mode, not an extra. */}
          <SegmentedControl
            value={obj.fillGradient ? "gradient" : "solid"}
            options={[{ value: "solid", label: "رنگ ساده" }, { value: "gradient", label: "گرادیان" }]}
            onChange={(v) => {
              commit();
              patch(v === "gradient" ? { fillGradient: { from: obj.fill, to: "#14C7A5", angle: 90 } } : { fillGradient: undefined });
            }}
          />
          {obj.fillGradient && (
            <>
              <ColorField label="گرادیان از" value={obj.fillGradient.from} onCommit={commit} onChange={(c) => patch({ fillGradient: { ...obj.fillGradient!, from: c } })} />
              <ColorField label="گرادیان تا" value={obj.fillGradient.to} onCommit={commit} onChange={(c) => patch({ fillGradient: { ...obj.fillGradient!, to: c } })} />
              <LabeledSlider label="زاویه" suffix="°" min={0} max={360} value={obj.fillGradient.angle} onCommit={commit} onChange={(v) => patch({ fillGradient: { ...obj.fillGradient!, angle: v } })} />
            </>
          )}

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
            <input
              type="checkbox"
              checked={!!obj.stroke}
              onChange={(e) => { commit(); patch(e.target.checked ? { stroke: "#000000", strokeWidth: 6 } : { stroke: undefined, strokeWidth: 0 }); }}
              className="w-4 h-4 accent-accent-500 rounded"
            />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">خط دور متن</span>
          </label>
          {obj.stroke && (
            <>
              <ColorField label="رنگ خط دور" value={obj.stroke} onCommit={commit} onChange={(c) => patch({ stroke: c })} />
              <LabeledSlider label="ضخامت خط" suffix="px" min={1} max={24} value={obj.strokeWidth ?? 6} onCommit={commit} onChange={(v) => patch({ strokeWidth: v })} />
            </>
          )}

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
            <input
              type="checkbox"
              checked={!!obj.shadow}
              onChange={(e) => { commit(); patch(e.target.checked ? { shadow: { color: "#000000", blur: 20, offsetX: 0, offsetY: 8, opacity: 0.5 } } : { shadow: undefined }); }}
              className="w-4 h-4 accent-accent-500 rounded"
            />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">سایه</span>
          </label>
          {obj.shadow && (
            <>
              <ColorField label="رنگ سایه" value={obj.shadow.color} onCommit={commit} onChange={(c) => patch({ shadow: { ...obj.shadow!, color: c } })} />
              <LabeledSlider label="محو سایه" min={0} max={80} value={obj.shadow.blur} onCommit={commit} onChange={(v) => patch({ shadow: { ...obj.shadow!, blur: v } })} />
              <LabeledSlider label="فاصله عمودی" min={-40} max={40} value={obj.shadow.offsetY} onCommit={commit} onChange={(v) => patch({ shadow: { ...obj.shadow!, offsetY: v } })} />
            </>
          )}

          <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
            <input
              type="checkbox"
              checked={!!obj.backgroundFill}
              onChange={(e) => { commit(); patch(e.target.checked ? { backgroundFill: "#14C7A5", backgroundPadding: 20, backgroundRadius: 16 } : { backgroundFill: undefined }); }}
              className="w-4 h-4 accent-accent-500 rounded"
            />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">هایلایت پشت متن</span>
          </label>
          {obj.backgroundFill && (
            <>
              <ColorField label="رنگ هایلایت" value={obj.backgroundFill} onCommit={commit} onChange={(c) => patch({ backgroundFill: c })} />
              <LabeledSlider label="فاصله داخلی" min={0} max={60} value={obj.backgroundPadding ?? 20} onCommit={commit} onChange={(v) => patch({ backgroundPadding: v })} />
              <LabeledSlider label="گردی گوشه" min={0} max={60} value={obj.backgroundRadius ?? 16} onCommit={commit} onChange={(v) => patch({ backgroundRadius: v })} />
            </>
          )}
        </PanelSection>
      )}

      {isShape(obj) && (
        <PanelSection title="شکل">
          <ColorField label="رنگ" value={obj.fill} onCommit={commit} onChange={(c) => patch({ fill: c })} />
          {obj.shape === "rect" && (
            <LabeledSlider label="گردی گوشه" suffix="px" min={0} max={200} value={obj.cornerRadius ?? 0} onCommit={commit} onChange={(v) => patch({ cornerRadius: v })} />
          )}
        </PanelSection>
      )}

      {isImage(obj) && (() => {
        const f = obj.filters ?? NEUTRAL_FILTERS;
        const crop = obj.crop ?? DEFAULT_CROP;
        const setF = (p: Partial<typeof f>) => patch({ filters: { ...f, ...p } });
        const setCrop = (p: Partial<typeof crop>) => patch({ crop: { ...crop, ...p } });
        const filtersTouched =
          f.brightness !== 0 || f.contrast !== 0 || f.saturation !== 0 || f.blur !== 0 || f.grayscale || f.sepia;

        return (
          <>
            <PanelSection title="برش تصویر">
              <div className="grid grid-cols-5 gap-1">
                {(["original", "1:1", "4:5", "9:16", "16:9"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => { commit(); setCrop({ aspect: a }); }}
                    className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                      crop.aspect === a
                        ? "bg-accent-500 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {a === "original" ? "اصلی" : a}
                  </button>
                ))}
              </div>
              <LabeledSlider label="بزرگ‌نمایی" min={1} max={3} step={0.05} value={crop.zoom} onCommit={commit} onChange={(v) => setCrop({ zoom: v })} />
              {crop.zoom > 1 || crop.aspect !== "original" ? (
                <>
                  <LabeledSlider label="جابه‌جایی افقی" min={-1} max={1} step={0.05} value={crop.offsetX} onCommit={commit} onChange={(v) => setCrop({ offsetX: v })} />
                  <LabeledSlider label="جابه‌جایی عمودی" min={-1} max={1} step={0.05} value={crop.offsetY} onCommit={commit} onChange={(v) => setCrop({ offsetY: v })} />
                </>
              ) : null}
              <div className="flex items-center gap-1">
                <ToolButton icon={FlipHorizontal} title="آینه افقی" active={!!obj.flipX} onClick={() => { commit(); patch({ flipX: !obj.flipX }); }} />
                <ToolButton icon={FlipVertical} title="آینه عمودی" active={!!obj.flipY} onClick={() => { commit(); patch({ flipY: !obj.flipY }); }} />
                <ToolButton icon={RotateCw} title="چرخش ۹۰ درجه" onClick={() => { commit(); patch({ rotation: (obj.rotation + 90) % 360 }); }} />
              </div>
            </PanelSection>

            <PanelSection
              title="فیلترها"
              action={
                filtersTouched ? (
                  <button
                    onClick={() => { commit(); patch({ filters: { ...NEUTRAL_FILTERS } }); }}
                    className="text-[10px] text-gray-400 hover:text-accent-500 transition-colors"
                  >
                    بازنشانی
                  </button>
                ) : undefined
              }
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { commit(); setF({ grayscale: !f.grayscale }); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    f.grayscale ? "bg-accent-500 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  سیاه‌وسفید
                </button>
                <button
                  onClick={() => { commit(); setF({ sepia: !f.sepia }); }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    f.sepia ? "bg-accent-500 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  سپیا
                </button>
              </div>
              <LabeledSlider label="روشنایی" min={-1} max={1} step={0.05} value={f.brightness} onCommit={commit} onChange={(v) => setF({ brightness: v })} />
              <LabeledSlider label="کنتراست" min={-100} max={100} value={f.contrast} onCommit={commit} onChange={(v) => setF({ contrast: v })} />
              <LabeledSlider label="اشباع رنگ" min={-2} max={5} step={0.1} value={f.saturation} onCommit={commit} onChange={(v) => setF({ saturation: v })} />
              <LabeledSlider label="محو (بلور)" suffix="px" min={0} max={40} value={f.blur} onCommit={commit} onChange={(v) => setF({ blur: v })} />
            </PanelSection>

            <PanelSection title="ظاهر تصویر">
              <LabeledSlider label="گردی گوشه" suffix="px" min={0} max={300} value={obj.cornerRadius} onCommit={commit} onChange={(v) => patch({ cornerRadius: v })} />
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!obj.stroke}
                  onChange={(e) => { commit(); patch(e.target.checked ? { stroke: "#FFFFFF", strokeWidth: 8 } : { stroke: undefined, strokeWidth: 0 }); }}
                  className="w-4 h-4 accent-accent-500 rounded"
                />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">کادر دور تصویر</span>
              </label>
              {obj.stroke && (
                <>
                  <ColorField label="رنگ کادر" value={obj.stroke} onCommit={commit} onChange={(c) => patch({ stroke: c })} />
                  <LabeledSlider label="ضخامت کادر" suffix="px" min={1} max={40} value={obj.strokeWidth ?? 8} onCommit={commit} onChange={(v) => patch({ strokeWidth: v })} />
                </>
              )}
            </PanelSection>
          </>
        );
      })()}

      <PanelSection title="چیدمان">
        <LabeledSlider label="شفافیت" suffix="%" min={0} max={100} value={Math.round(obj.opacity * 100)} onCommit={commit} onChange={(v) => patch({ opacity: v / 100 })} />
        <LabeledSlider label="چرخش" suffix="°" min={-180} max={180} value={obj.rotation} onCommit={commit} onChange={(v) => patch({ rotation: v })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">عرض</span>
            <input
              type="number" value={Math.round(obj.width)} onFocus={commit}
              onChange={(e) => patch({ width: Math.max(20, Number(e.target.value)) })}
              className="input-base w-full" dir="ltr"
            />
          </div>
          <div>
            <span className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">ارتفاع</span>
            <input
              type="number" value={Math.round(obj.height)} onFocus={commit}
              onChange={(e) => patch({ height: Math.max(20, Number(e.target.value)) })}
              className="input-base w-full" dir="ltr"
            />
          </div>
        </div>
      </PanelSection>
    </div>
  );
}
