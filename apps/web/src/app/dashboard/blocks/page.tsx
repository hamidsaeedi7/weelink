"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Eye, Loader2, Link2 } from "lucide-react";
import { toast } from "sonner";
import { blocksApi, shopsApi } from "@/lib/api";
import { SortableBlock } from "@/components/blocks/SortableBlock";
import { AddBlockModal } from "@/components/blocks/AddBlockModal";
import { BlockEditPanel } from "@/components/blocks/BlockEditPanel";
import { ShareBar } from "@/components/ShareBar";
import type { BlockType } from "@/components/blocks/block-types";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [slug, setSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editBlock, setEditBlock] = useState<any>(null);
  const [saving, setSaving] = useState(false);

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
      setSlug(shopData?.slug || "");
    } catch {
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(reordered);
    setSaving(true);
    try {
      await blocksApi.reorder(reordered.map((b) => b.id));
    } catch {
      toast.error("خطا در ذخیره ترتیب");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = async (type: BlockType) => {
    // Optimistic: close the picker and show the new block instantly, then
    // reconcile with the server-created block (avoids the click→wait delay).
    setShowAdd(false);
    const tempId = `temp-${Date.now()}`;
    const temp = {
      id: tempId, type, label: "", url: "", icon: "",
      data: {}, isActive: true, _pending: true,
    };
    setBlocks((prev) => [...prev, temp]);
    try {
      const newBlock = await blocksApi.create({ type }) as any;
      setBlocks((prev) => prev.map((b) => (b.id === tempId ? newBlock : b)));
      setEditBlock(newBlock);
    } catch {
      setBlocks((prev) => prev.filter((b) => b.id !== tempId));
      toast.error("خطا در افزودن بلوک");
    }
  };

  const handleSaveBlock = async (data: Record<string, any>) => {
    await blocksApi.update(editBlock.id, data);
    setBlocks((prev) =>
      prev.map((b) => (b.id === editBlock.id ? { ...b, ...data } : b)),
    );
    toast.success("ذخیره شد");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await blocksApi.remove(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      toast.success("حذف شد");
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const handleToggle = async (block: any) => {
    const updated = { isActive: !block.isActive };
    try {
      await blocksApi.update(block.id, updated);
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, ...updated } : b)));
    } catch {
      toast.error("خطا");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-accent-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">ویرایش لینک‌ها</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {blocks.length} بلوک
            {saving && <span className="text-accent-400 mr-2">• در حال ذخیره...</span>}
          </p>
        </div>
        {/* موبایل: پیش‌نمایش/کپی/اشتراک در یک ردیف، «بلوک جدید» تمام‌عرض زیرشان — دسکتاپ: همه در یک خط */}
        <div className="w-full sm:w-auto space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
          {slug && (
            <div className="flex items-center gap-2">
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm
                           border border-gray-200 dark:border-white/10
                           text-gray-600 dark:text-gray-400 hover:border-accent-500/50
                           hover:text-accent-500 transition-all">
                <Eye className="w-4 h-4" />
                پیش‌نمایش
              </a>
              <ShareBar url={`https://weeelink.ir/${slug}`} />
            </div>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm
                       bg-accent-500 hover:bg-accent-400 text-white font-bold
                       transition-all shadow-[0_0_15px_rgb(var(--accent-500-rgb) / 0.25)]">
            <Plus className="w-4 h-4" />
            بلوک جدید
          </button>
        </div>
      </div>

      {/* Empty State */}
      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-accent-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-900 dark:text-white">هنوز بلوکی ندارید</p>
            <p className="text-sm text-gray-500 mt-1">اولین لینک یا بلوک خود را اضافه کنید</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-accent-500 text-white font-bold text-sm hover:bg-accent-400 transition-all">
            <Plus className="w-4 h-4" />
            افزودن اولین بلوک
          </button>
        </div>
      )}

      {/* DnD Block List */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onEdit={() => setEditBlock(block)}
                  onDelete={() => handleDelete(block.id)}
                  onToggle={() => handleToggle(block)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Add Button bottom */}
      {blocks.length > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                     border border-dashed border-gray-300 dark:border-white/10
                     text-gray-500 dark:text-gray-600 text-sm
                     hover:border-accent-500/40 hover:text-accent-400 transition-all">
          <Plus className="w-4 h-4" />
          افزودن بلوک
        </button>
      )}

      {/* Modals */}
      {showAdd && (
        <AddBlockModal
          onSelect={handleAddBlock}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editBlock && (
        <BlockEditPanel
          block={editBlock}
          onSave={handleSaveBlock}
          onClose={() => setEditBlock(null)}
        />
      )}
    </div>
  );
}
