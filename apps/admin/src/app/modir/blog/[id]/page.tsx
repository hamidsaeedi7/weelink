"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Save, Eye, ArrowRight, Globe, Upload } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import RichEditor from "@/components/editor/RichEditor";

export default function EditBlogPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", slug: "", excerpt: "", content: "",
    coverImage: "", tags: [], isPublished: false,
    seoTitle: "", seoDesc: "",
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    (adminApi.getBlogPost(id as string) as Promise<any>).then((post) => {
      setForm({ ...post, tags: post.tags || [] });
    }).catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const [coverUploading, setCoverUploading] = useState(false);
  const uploadCover = async (file: File) => {
    setCoverUploading(true);
    try {
      const url = await adminApi.uploadImage(file);
      set("coverImage", url);
      toast.success("تصویر آپلود شد");
    } catch { toast.error("خطا در آپلود تصویر"); }
    finally { setCoverUploading(false); }
  };

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!form.tags.includes(tagInput.trim())) {
        set("tags", [...form.tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.updateBlogPost(id as string, form);
      toast.success("پست ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Topbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/modir/blog")}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            <ArrowRight className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">ویرایش پست</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <Globe className="w-4 h-4" />
            انتشار
            <div className="relative" onClick={() => set("isPublished", !form.isPublished)}>
              <div className={`w-10 h-5 rounded-full transition-colors ${form.isPublished ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"}`} />
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </label>
          <button onClick={save} disabled={saving}
            className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ذخیره
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5 space-y-4">
            <input value={form.title} onChange={(e) => {
              set("title", e.target.value);
              if (!form.slug || form.slug === form.title.toLowerCase().replace(/\s+/g, "-")) {
                set("slug", e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
              }
            }}
              placeholder="عنوان پست *" className="input-base text-lg font-bold" />

            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} dir="ltr"
              placeholder="slug-url" className="input-base text-sm font-mono" />

            <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)}
              rows={2} placeholder="خلاصه پست (اختیاری)"
              className="input-base resize-none text-sm" />
          </div>

          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">محتوا</p>
            </div>
            <RichEditor
              content={form.content}
              onChange={(html) => set("content", html)}
              placeholder="محتوای پست را بنویسید..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">تصویر شاخص</h3>
            {form.coverImage && (
              <img src={form.coverImage} alt="" className="w-full aspect-video object-cover rounded-xl" />
            )}
            <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-sm text-gray-500 cursor-pointer hover:border-orange-500/50 hover:text-orange-500 transition-colors">
              {coverUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {coverUploading ? "در حال آپلود…" : "آپلود تصویر کاور"}
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
            </label>
            <input value={form.coverImage || ""} onChange={(e) => set("coverImage", e.target.value)}
              placeholder="یا آدرس URL تصویر" dir="ltr" className="input-base text-sm" />
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">برچسب‌ها</h3>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag}
              placeholder="برچسب + Enter" className="input-base text-sm" />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag: string) => (
                  <span key={tag}
                    className="flex items-center gap-1 text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
                    {tag}
                    <button onClick={() => set("tags", form.tags.filter((t: string) => t !== tag))}
                      className="text-orange-400 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">تنظیمات SEO</h3>
            <input value={form.seoTitle || ""} onChange={(e) => set("seoTitle", e.target.value)}
              placeholder="عنوان SEO" className="input-base text-sm" />
            <textarea value={form.seoDesc || ""} onChange={(e) => set("seoDesc", e.target.value)}
              rows={3} placeholder="توضیح متا" className="input-base resize-none text-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
