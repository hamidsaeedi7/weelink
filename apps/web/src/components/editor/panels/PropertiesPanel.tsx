"use client";

import {
  AlignCenter, AlignLeft, AlignRight, MousePointerSquareDashed,
  Trash2, Copy, Lock, Unlock, Eye, EyeOff, BringToFront, SendToBack,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { EDITOR_FONTS } from "@/lib/editor/presets";
import { isImage, isShape, isText, type Background } from "@/lib/editor/types";
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

      {isShape(obj) && (
        <PanelSection title="شکل">
          <ColorField label="رنگ" value={obj.fill} onCommit={commit} onChange={(c) => patch({ fill: c })} />
          {obj.shape === "rect" && (
            <LabeledSlider label="گردی گوشه" suffix="px" min={0} max={200} value={obj.cornerRadius ?? 0} onCommit={commit} onChange={(v) => patch({ cornerRadius: v })} />
          )}
        </PanelSection>
      )}

      {isImage(obj) && (
        <PanelSection title="تصویر">
          <LabeledSlider label="گردی گوشه" suffix="px" min={0} max={300} value={obj.cornerRadius} onCommit={commit} onChange={(v) => patch({ cornerRadius: v })} />
        </PanelSection>
      )}

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
