"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Eye, Loader2, Link2, Undo2, Smartphone, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { blocksApi, shopsApi, productsApi, accountApi } from "@/lib/api";
import { SortableBlock } from "@/components/blocks/SortableBlock";
import { AddBlockModal } from "@/components/blocks/AddBlockModal";
import { BlockEditPanel } from "@/components/blocks/BlockEditPanel";
import { ThemePicker } from "@/components/blocks/ThemePicker";
import { TemplateGallery } from "@/components/blocks/TemplateGallery";
import { BioPreview, PhoneFrame } from "@/components/blocks/BioPreview";
import { ShareBar } from "@/components/ShareBar";
import { PageHeader, PageTabs } from "@/components/dashboard/PageHeader";
import { getBlockDef, type BlockType } from "@/components/blocks/block-types";
import type { PageTemplate } from "@/lib/page-templates";

type Tab = "blocks" | "templates" | "style";
type Snapshot = { blocks: any[]; bioTheme?: string; bioMode?: string; primaryColor?: string };

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [slug, setSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("blocks");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [undo, setUndo] = useState<Snapshot | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    try {
      const [blocksData, shopData] = await Promise.all([
        blocksApi.getAll() as unknown as Promise<any[]>,
        shopsApi.getMine() as Promise<any>,
      ]);
      setBlocks(blocksData || []);
      setShop(shopData);
      setSlug(shopData?.slug || "");
    } catch {
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Products feed the preview's PRODUCT_GRID blocks in `auto` mode. Failure is
  // non-fatal — the grid simply renders nothing, exactly as the live page would.
  useEffect(() => {
    (productsApi.getAll() as unknown as Promise<any[]>)
      .then((p) => setProducts(Array.isArray(p) ? p : []))
      .catch(() => {});
    (accountApi.getMe() as Promise<any>)
      .then((u) => setIsPro(u?.plan === "PRO"))
      .catch(() => {});
  }, []);

  const editBlock = blocks.find((b) => b.id === editId) || null;

  /**
   * What the preview paints: the saved blocks, with the block currently open
   * in the editor swapped for its unsaved draft. That is what makes typing in
   * the panel show up in the phone frame instantly.
   */
  const previewBlocks = useMemo(() => {
    if (!editId || !draft) return blocks;
    return blocks.map((b) => (b.id === editId ? { ...b, ...draft } : b));
  }, [blocks, editId, draft]);

  const openEditor = (id: string) => {
    setEditId(id);
    setDraft(null);
    setMobileView("edit");
    setTab("blocks");
  };

  const closeEditor = () => { setEditId(null); setDraft(null); };

  // ─── mutations ──────────────────────────────────────────────────────────────

  const selectBioTheme = async (id: string) => {
    setShop((s: any) => ({ ...s, bioTheme: id }));
    try { await shopsApi.update({ bioTheme: id }); }
    catch { toast.error("خطا در ذخیره قالب"); load(); }
  };

  const selectBioMode = async (id: string) => {
    setShop((s: any) => ({ ...s, bioMode: id }));
    try { await shopsApi.update({ bioMode: id }); }
    catch { toast.error("خطا در ذخیره حالت رنگ"); load(); }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);
    setSaving(true);
    try { await blocksApi.reorder(reordered.map((b) => b.id)); }
    catch { toast.error("خطا در ذخیره ترتیب"); load(); }
    finally { setSaving(false); }
  };

  const handleAddBlock = async (type: BlockType) => {
    setShowAdd(false);
    const tempId = `temp-${Date.now()}`;
    // Ship the type's own defaults so a new mini-site block renders something
    // meaningful the moment it appears, instead of an invisible empty shell.
    const defaults = getBlockDef(type).defaults || {};
    const temp = { id: tempId, type, label: "", url: "", icon: "", data: defaults, isActive: true, _pending: true };
    setBlocks((prev) => [...prev, temp]);
    try {
      const newBlock = await blocksApi.create({ type, data: defaults }) as any;
      setBlocks((prev) => prev.map((b) => (b.id === tempId ? newBlock : b)));
      openEditor(newBlock.id);
    } catch {
      setBlocks((prev) => prev.filter((b) => b.id !== tempId));
      toast.error("خطا در افزودن بلوک");
    }
  };

  const handleSaveBlock = async (data: Record<string, any>) => {
    if (!editId) return;
    await blocksApi.update(editId, data);
    setBlocks((prev) => prev.map((b) => (b.id === editId ? { ...b, ...data } : b)));
    toast.success("ذخیره شد");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await blocksApi.remove(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (editId === id) closeEditor();
      toast.success("حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const handleToggle = async (block: any) => {
    const updated = { isActive: !block.isActive };
    try {
      await blocksApi.update(block.id, updated);
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, ...updated } : b)));
    } catch { toast.error("خطا"); }
  };

  const applyTemplate = async (template: PageTemplate, mode: "replace" | "append") => {
    try {
      const res = await blocksApi.applyTemplate({
        templateId: template.id,
        mode,
        blocks: template.blocks,
        bioTheme: template.theme,
        bioMode: template.mode,
        primaryColor: template.primaryColor,
      }) as any;

      setBlocks(res.blocks || []);
      if (mode === "replace") {
        setShop((s: any) => ({ ...s, bioTheme: template.theme, bioMode: template.mode, primaryColor: template.primaryColor }));
        setUndo(res.snapshot || null);
      }
      closeEditor();
      setTab("blocks");
      toast.success(`قالب «${template.label}» اعمال شد`);
    } catch (e: any) {
      // PRO_REQUIRED is handled globally by the axios interceptor, which opens
      // the upgrade modal — don't also show a red toast on top of it.
      if (e?.response?.data?.code !== "PRO_REQUIRED") toast.error("خطا در اعمال قالب");
      throw e;
    }
  };

  const handleUndo = async () => {
    if (!undo) return;
    try {
      const restored = await blocksApi.restore(undo) as unknown as any[];
      setBlocks(restored || []);
      setShop((s: any) => ({ ...s, bioTheme: undo.bioTheme, bioMode: undo.bioMode, primaryColor: undo.primaryColor }));
      setUndo(null);
      toast.success("به حالت قبل برگشت");
    } catch { toast.error("خطا در بازگردانی"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 aria-hidden="true" className="w-6 h-6 text-accent-500 animate-spin" />
      </div>
    );
  }

  // ─── panes ──────────────────────────────────────────────────────────────────

  // While a block is open, the panel takes over the editor column rather than
  // floating over the page — a modal would cover the live preview, which is
  // the whole point of editing here.
  const editorPane = editBlock ? (
    <BlockEditPanel
      key={editBlock.id}
      block={editBlock}
      variant="inline"
      onSave={handleSaveBlock}
      onChange={setDraft}
      onClose={closeEditor}
    />
  ) : (
    <div className="space-y-4">
      <PageTabs
        label="بخش‌های ویرایشگر"
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "blocks", label: "بلوک‌ها" },
          { value: "templates", label: "قالب آماده" },
          { value: "style", label: "ظاهر" },
        ]}
      />

      {tab === "style" && (
        <ThemePicker
          shop={shop}
          value={shop?.bioTheme || "modern"}
          mode={shop?.bioMode || "dark"}
          onSelect={selectBioTheme}
          onSelectMode={selectBioMode}
        />
      )}

      {tab === "templates" && (
        <TemplateGallery shop={shop} hasBlocks={blocks.length > 0} isPro={isPro} onApply={applyTemplate} />
      )}

      {tab === "blocks" && (
        <>
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center">
                <Link2 aria-hidden="true" className="w-8 h-8 text-accent-700" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white">هنوز بلوکی ندارید</p>
                <p className="text-sm text-gray-500 mt-1">
                  از یک قالب آماده شروع کن، یا بلوک‌ها را یکی‌یکی بساز
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTab("templates")} className="btn-primary !py-2.5 px-5 text-sm">
                  انتخاب قالب آماده
                </button>
                <button onClick={() => setShowAdd(true)} className="btn-secondary !py-2.5 px-5 text-sm">
                  <Plus aria-hidden="true" className="w-4 h-4" />
                  بلوک جدید
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {blocks.map((block) => (
                      <SortableBlock
                        key={block.id}
                        block={block}
                        onEdit={() => openEditor(block.id)}
                        onDelete={() => handleDelete(block.id)}
                        onToggle={() => handleToggle(block)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>

              <button onClick={() => setShowAdd(true)}
                className="flex items-center justify-center gap-2 w-full min-h-[2.75rem] rounded-xl
                           border border-dashed border-gray-300 dark:border-white/10
                           text-gray-600 dark:text-gray-400 text-sm
                           hover:border-accent-500/50 hover:text-accent-700 transition-all">
                <Plus aria-hidden="true" className="w-4 h-4" />
                افزودن بلوک
              </button>
            </>
          )}
        </>
      )}
    </div>
  );

  const previewPane = (
    <div className="xl:sticky xl:top-4">
      <p className="text-[11px] text-gray-500 text-center mb-2">
        پیش‌نمایش زنده — روی هر بخش کلیک کن تا ویرایشش کنی
      </p>
      <PhoneFrame>
        <BioPreview
          shop={shop}
          blocks={previewBlocks}
          products={products}
          selectedId={editId}
          onSelect={openEditor}
        />
      </PhoneFrame>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="ویرایش صفحه"
        description={
          <>
            {blocks.length} بلوک
            {saving && <span className="text-accent mr-2">• در حال ذخیره...</span>}
          </>
        }
        actions={
          <>
            {slug && (
              <>
                <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[var(--tap-target)] px-3 rounded-xl text-sm
                             border border-gray-300 dark:border-white/15
                             text-gray-700 dark:text-gray-300 hover:border-accent-500/50
                             hover:text-accent transition-all">
                  <Eye aria-hidden="true" className="icon-sm" />
                  صفحه واقعی
                </a>
                <ShareBar url={`https://weeelink.ir/${slug}`} className="flex-1 sm:flex-none" />
              </>
            )}
            <button onClick={() => setShowAdd(true)} className="btn-primary py-2 px-4 text-sm">
              <Plus aria-hidden="true" className="icon-sm" />
              بلوک جدید
            </button>
          </>
        }
      />

      {/* Undo affordance after a destructive template apply. Stays until it is
          used or another template is applied — a 5-second toast is not enough
          time to look at a whole new page and decide. */}
      {undo && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.08]">
          <p className="flex-1 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            قالب جدید اعمال شد و بلوک‌های قبلی جایگزین شدند.
          </p>
          <button onClick={handleUndo}
            className="flex items-center gap-1.5 shrink-0 min-h-[2.25rem] px-3 rounded-lg text-xs font-bold
                       bg-amber-500 text-amber-950">
            <Undo2 aria-hidden="true" className="w-3.5 h-3.5" />
            بازگردانی
          </button>
          <button onClick={() => setUndo(null)} aria-label="بستن پیام"
            className="shrink-0 text-amber-700 dark:text-amber-300 text-lg leading-none px-1">×</button>
        </div>
      )}

      {/* Mobile: edit and preview are separate views — a phone cannot show both
          at once, and a squeezed preview is worse than a full-width one. */}
      <div role="tablist" aria-label="نمای ویرایشگر" className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5 xl:hidden">
        {([["edit", "ویرایش", PencilLine], ["preview", "پیش‌نمایش", Smartphone]] as const).map(([id, label, Icon]) => (
          <button key={id} role="tab" aria-selected={mobileView === id} onClick={() => setMobileView(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[2.5rem] rounded-lg text-xs font-bold transition-all
                        ${mobileView === id
                          ? "bg-accent-500 text-[color:var(--accent-on-solid)] shadow-sm"
                          : "text-gray-600 dark:text-gray-400"}`}>
            <Icon aria-hidden="true" className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] xl:gap-6 xl:items-start">
        <div className={mobileView === "edit" ? "" : "hidden xl:block"}>{editorPane}</div>
        <div className={mobileView === "preview" ? "" : "hidden xl:block"}>{previewPane}</div>
      </div>

      {showAdd && <AddBlockModal onSelect={handleAddBlock} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
