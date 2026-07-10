"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save, ArrowUp, ArrowDown, Trash2, Plus, ChevronDown, ChevronUp,
  Layers, Star, AlignLeft, HelpCircle, Code2, Zap, ArrowRight,
} from "lucide-react";
import { adminApi } from "@/lib/api";

type BlockType = "hero" | "features" | "text_image" | "cta" | "faq" | "html";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
}

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  blocks: Block[];
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: "hero", label: "هیرو", icon: <Star size={22} />, desc: "بنر اصلی با عنوان و دکمه" },
  { type: "features", label: "ویژگی‌ها", icon: <Layers size={22} />, desc: "گرید کارت‌های ویژگی" },
  { type: "text_image", label: "متن + تصویر", icon: <AlignLeft size={22} />, desc: "متن در کنار تصویر" },
  { type: "cta", label: "فراخوان عمل", icon: <Zap size={22} />, desc: "بخش دعوت به اقدام" },
  { type: "faq", label: "سوالات متداول", icon: <HelpCircle size={22} />, desc: "آکاردئون سوال‌وجواب" },
  { type: "html", label: "HTML خام", icon: <Code2 size={22} />, desc: "کد HTML سفارشی" },
];

const defaultData = (type: BlockType): Record<string, unknown> => {
  switch (type) {
    case "hero": return { title: "", subtitle: "", btnText: "", btnLink: "", bgImage: "" };
    case "features": return { title: "", items: [{ icon: "⭐", title: "", desc: "" }] };
    case "text_image": return { title: "", text: "", image: "", dir: "right" };
    case "cta": return { title: "", subtitle: "", btnText: "", btnLink: "", bgColor: "#6366f1" };
    case "faq": return { title: "", items: [{ q: "", a: "" }] };
    case "html": return { code: "" };
    default: return {};
  }
};

let idCounter = 0;
const genId = () => `blk_${Date.now()}_${idCounter++}`;

function HeroEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div><label className="text-white/60 text-xs mb-1 block">عنوان اصلی</label><input className="input-base w-full" value={String(data.title ?? "")} onChange={e => set("title", e.target.value)} /></div>
      <div><label className="text-white/60 text-xs mb-1 block">زیرعنوان</label><input className="input-base w-full" value={String(data.subtitle ?? "")} onChange={e => set("subtitle", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-white/60 text-xs mb-1 block">متن دکمه</label><input className="input-base w-full" value={String(data.btnText ?? "")} onChange={e => set("btnText", e.target.value)} /></div>
        <div><label className="text-white/60 text-xs mb-1 block">لینک دکمه</label><input className="input-base w-full" value={String(data.btnLink ?? "")} onChange={e => set("btnLink", e.target.value)} /></div>
      </div>
      <div><label className="text-white/60 text-xs mb-1 block">تصویر پس‌زمینه (URL)</label><input className="input-base w-full" value={String(data.bgImage ?? "")} onChange={e => set("bgImage", e.target.value)} placeholder="https://..." /></div>
    </div>
  );
}

function FeaturesEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data.items as Array<{ icon: string; title: string; desc: string }>) ?? [];
  const setItem = (i: number, k: string, v: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [k]: v } : it);
    onChange({ ...data, items: next });
  };
  const addItem = () => onChange({ ...data, items: [...items, { icon: "✨", title: "", desc: "" }] });
  const removeItem = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-3">
      <div><label className="text-white/60 text-xs mb-1 block">عنوان بخش</label><input className="input-base w-full" value={String(data.title ?? "")} onChange={e => onChange({ ...data, title: e.target.value })} /></div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs">ویژگی {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-white/50 text-xs mb-1 block">آیکون</label><input className="input-base w-full" value={item.icon} onChange={e => setItem(i, "icon", e.target.value)} /></div>
              <div className="col-span-2"><label className="text-white/50 text-xs mb-1 block">عنوان</label><input className="input-base w-full" value={item.title} onChange={e => setItem(i, "title", e.target.value)} /></div>
            </div>
            <div><label className="text-white/50 text-xs mb-1 block">توضیحات</label><input className="input-base w-full" value={item.desc} onChange={e => setItem(i, "desc", e.target.value)} /></div>
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus size={14} /> افزودن ویژگی</button>
      </div>
    </div>
  );
}

function TextImageEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div><label className="text-white/60 text-xs mb-1 block">عنوان</label><input className="input-base w-full" value={String(data.title ?? "")} onChange={e => set("title", e.target.value)} /></div>
      <div><label className="text-white/60 text-xs mb-1 block">متن</label><textarea className="input-base w-full" rows={3} value={String(data.text ?? "")} onChange={e => set("text", e.target.value)} /></div>
      <div><label className="text-white/60 text-xs mb-1 block">تصویر (URL)</label><input className="input-base w-full" value={String(data.image ?? "")} onChange={e => set("image", e.target.value)} placeholder="https://..." /></div>
      <div>
        <label className="text-white/60 text-xs mb-1 block">جهت تصویر</label>
        <select className="input-base w-full" value={String(data.dir ?? "right")} onChange={e => set("dir", e.target.value)}>
          <option value="right">تصویر راست</option>
          <option value="left">تصویر چپ</option>
        </select>
      </div>
    </div>
  );
}

function CtaEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const set = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div><label className="text-white/60 text-xs mb-1 block">عنوان</label><input className="input-base w-full" value={String(data.title ?? "")} onChange={e => set("title", e.target.value)} /></div>
      <div><label className="text-white/60 text-xs mb-1 block">زیرعنوان</label><input className="input-base w-full" value={String(data.subtitle ?? "")} onChange={e => set("subtitle", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-white/60 text-xs mb-1 block">متن دکمه</label><input className="input-base w-full" value={String(data.btnText ?? "")} onChange={e => set("btnText", e.target.value)} /></div>
        <div><label className="text-white/60 text-xs mb-1 block">لینک دکمه</label><input className="input-base w-full" value={String(data.btnLink ?? "")} onChange={e => set("btnLink", e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-white/60 text-xs">رنگ پس‌زمینه</label>
        <input type="color" value={String(data.bgColor ?? "#6366f1")} onChange={e => set("bgColor", e.target.value)} className="w-10 h-8 rounded cursor-pointer bg-transparent border border-white/20" />
        <span className="text-white/40 text-xs font-mono">{String(data.bgColor ?? "#6366f1")}</span>
      </div>
    </div>
  );
}

function FaqEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data.items as Array<{ q: string; a: string }>) ?? [];
  const setItem = (i: number, k: string, v: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [k]: v } : it);
    onChange({ ...data, items: next });
  };
  const addItem = () => onChange({ ...data, items: [...items, { q: "", a: "" }] });
  const removeItem = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });
  return (
    <div className="space-y-3">
      <div><label className="text-white/60 text-xs mb-1 block">عنوان بخش</label><input className="input-base w-full" value={String(data.title ?? "")} onChange={e => onChange({ ...data, title: e.target.value })} /></div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-xs">سوال {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
            </div>
            <div><label className="text-white/50 text-xs mb-1 block">سوال</label><input className="input-base w-full" value={item.q} onChange={e => setItem(i, "q", e.target.value)} /></div>
            <div><label className="text-white/50 text-xs mb-1 block">جواب</label><textarea className="input-base w-full" rows={2} value={item.a} onChange={e => setItem(i, "a", e.target.value)} /></div>
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus size={14} /> افزودن سوال</button>
      </div>
    </div>
  );
}

function HtmlEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className="text-white/60 text-xs mb-1 block">کد HTML</label>
      <textarea className="input-base w-full font-mono text-xs" rows={8} value={String(data.code ?? "")} onChange={e => onChange({ ...data, code: e.target.value })} placeholder="<div>...</div>" />
    </div>
  );
}

function BlockEditor({ block, onChange }: { block: Block; onChange: (d: Record<string, unknown>) => void }) {
  switch (block.type) {
    case "hero": return <HeroEditor data={block.data} onChange={onChange} />;
    case "features": return <FeaturesEditor data={block.data} onChange={onChange} />;
    case "text_image": return <TextImageEditor data={block.data} onChange={onChange} />;
    case "cta": return <CtaEditor data={block.data} onChange={onChange} />;
    case "faq": return <FaqEditor data={block.data} onChange={onChange} />;
    case "html": return <HtmlEditor data={block.data} onChange={onChange} />;
  }
}

export default function LandingPageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [page, setPage] = useState<LandingPage | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customHtml, setCustomHtml] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [customJs, setCustomJs] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getLandingPage(id);
      setPage(data);
      setBlocks((data.blocks ?? []).map((b: Block) => ({ ...b, id: b.id || genId() })));
      setTitle(data.title);
      setSlug(data.slug);
      setIsPublished(data.isPublished);
      setCustomHtml(data.customHtml || "");
      setCustomCss(data.customCss || "");
      setCustomJs(data.customJs || "");
    } catch {
      toast.error("خطا در بارگذاری صفحه");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addBlock = (type: BlockType) => {
    const newBlock: Block = { id: genId(), type, data: defaultData(type) };
    setBlocks(b => [...b, newBlock]);
    setExpandedId(newBlock.id);
  };

  const removeBlock = (bid: string) => {
    if (!confirm("این بلاک حذف شود؟")) return;
    setBlocks(b => b.filter(x => x.id !== bid));
  };

  const moveBlock = (index: number, dir: "up" | "down") => {
    setBlocks(b => {
      const next = [...b];
      const target = dir === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return b;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateBlockData = (bid: string, data: Record<string, unknown>) => {
    setBlocks(b => b.map(x => x.id === bid ? { ...x, data } : x));
  };

  const save = async () => {
    try {
      setSaving(true);
      await adminApi.updateLandingPage(id, { title, slug, isPublished, blocks, customHtml, customCss, customJs });
      toast.success("صفحه ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره‌سازی");
    } finally {
      setSaving(false);
    }
  };

  const typeInfo = (type: BlockType) => BLOCK_TYPES.find(t => t.type === type)!;

  if (loading) return <div className="flex items-center justify-center h-64 text-white/50" dir="rtl">در حال بارگذاری...</div>;
  if (!page) return <div className="flex items-center justify-center h-64 text-red-400" dir="rtl">صفحه یافت نشد</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/modir/landing-pages")} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white">
          <ArrowRight size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">ویرایشگر صفحه لندینگ</h1>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="text-white/60 text-xs mb-1 block">عنوان صفحه</label>
            <input className="input-base w-full" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-white/60 text-xs mb-1 block">اسلاگ</label>
            <input className="input-base w-full font-mono text-sm" value={slug} onChange={e => setSlug(e.target.value)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={"relative w-11 h-6 rounded-full transition " + (isPublished ? "bg-emerald-500" : "bg-white/20")}
                onClick={() => setIsPublished(v => !v)}
              >
                <div className={"absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all " + (isPublished ? "right-1" : "left-1")} />
              </div>
              <span className="text-white/70 text-sm">{isPublished ? <span className="text-emerald-400">منتشر شده</span> : "پیش‌نویس"}</span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <div className="glass-card p-4">
            <h2 className="text-white font-semibold mb-4 text-sm">افزودن بلاک</h2>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition text-center group"
                >
                  <span className="text-white/60 group-hover:text-white transition">{bt.icon}</span>
                  <span className="text-white text-xs font-medium">{bt.label}</span>
                  <span className="text-white/40 text-[10px] leading-tight">{bt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-3">
          {blocks.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center h-48 text-white/30 gap-3">
              <Layers size={36} />
              <p className="text-sm">بلاکی اضافه نشده است</p>
              <p className="text-xs">از پنل سمت چپ بلاک انتخاب کنید</p>
            </div>
          ) : (
            blocks.map((block, index) => {
              const info = typeInfo(block.type);
              const expanded = expandedId === block.id;
              return (
                <div key={block.id} className="glass-card overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition"
                    onClick={() => setExpandedId(expanded ? null : block.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <button onClick={e => { e.stopPropagation(); moveBlock(index, "up"); }} disabled={index === 0}
                        className="text-white/30 hover:text-white disabled:opacity-20 transition"><ArrowUp size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); moveBlock(index, "down"); }} disabled={index === blocks.length - 1}
                        className="text-white/30 hover:text-white disabled:opacity-20 transition"><ArrowDown size={13} /></button>
                    </div>
                    <span className="text-white/50">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm font-medium">{info.label}</span>
                      <span className="text-white/30 text-xs mr-2">بلاک {index + 1}</span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); removeBlock(block.id); }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                    {expanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </div>
                  {expanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/10">
                      <BlockEditor block={block} onChange={d => updateBlockData(block.id, d)} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* کد سفارشی HTML / CSS / JavaScript */}
      <div className="glass-card p-5 mt-6 space-y-4">
        <h2 className="text-white font-semibold text-sm">کد سفارشی (HTML / CSS / JavaScript)</h2>
        <p className="text-white/40 text-xs">این کدها به‌همراه بلاک‌ها در صفحه رندر می‌شوند. برای صفحهٔ کاملاً سفارشی می‌توانید فقط از HTML استفاده کنید.</p>
        <div>
          <label className="text-white/60 text-xs mb-1 block">HTML</label>
          <textarea value={customHtml} onChange={e => setCustomHtml(e.target.value)} dir="ltr" spellCheck={false}
            className="input-base w-full font-mono text-xs h-40 resize-y" placeholder="<section> ... </section>" />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">CSS</label>
          <textarea value={customCss} onChange={e => setCustomCss(e.target.value)} dir="ltr" spellCheck={false}
            className="input-base w-full font-mono text-xs h-32 resize-y" placeholder=".my-class { color: red; }" />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">JavaScript</label>
          <textarea value={customJs} onChange={e => setCustomJs(e.target.value)} dir="ltr" spellCheck={false}
            className="input-base w-full font-mono text-xs h-32 resize-y" placeholder="console.log('hi')" />
        </div>
      </div>
    </div>
  );
}
