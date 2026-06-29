"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import RichEditor from "@/components/editor/RichEditor";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    tags: [] as string[],
    tagInput: "",
    coverImage: "",
    seoTitle: "",
    seoDesc: "",
    isPublished: false,
  });

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug === slugify(prev.title) || prev.slug === "" ? slugify(title) : prev.slug,
    }));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = form.tagInput.trim().replace(/,$/, "");
      if (tag && !form.tags.includes(tag)) {
        set("tags", [...form.tags, tag]);
      }
      set("tagInput", "");
    }
  };

  const removeTag = (tag: string) =>
    set("tags", form.tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("عنوان الزامی است"); return; }
    if (!form.content || form.content === "<p></p>") { toast.error("محتوا الزامی است"); return; }
    setSaving(true);
    try {
      await adminApi.createBlogPost({
        title: form.title,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt,
        content: form.content,
        tags: form.tags,
        coverImage: form.coverImage,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDesc,
        isPublished: form.isPublished,
      });
      toast.success("پست با موفقیت ایجاد شد");
      router.push("/modir/blog");
    } catch {
      toast.error("خطا در ایجاد پست");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">پست جدید</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">ایجاد پست وبلاگ جدید</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/modir/blog")}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="glass-card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                عنوان <span className="text-red-500">*</span>
              </label>
              <input
                className="input-base w-full"
                placeholder="عنوان پست را وارد کنید"
                value={form.title}
                onChange={handleTitleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Slug (آدرس)
              </label>
              <input
                className="input-base w-full font-mono text-sm"
                placeholder="post-slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              خلاصه
            </label>
            <textarea
              className="input-base w-full resize-none"
              rows={3}
              placeholder="خلاصه‌ای کوتاه از پست..."
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              برچسب‌ها
            </label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-2 min-h-[44px] flex flex-wrap gap-2 bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500/20">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="برچسب + Enter"
                value={form.tagInput}
                onChange={(e) => set("tagInput", e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              تصویر کاور (URL)
            </label>
            <input
              className="input-base w-full"
              placeholder="https://example.com/image.jpg"
              value={form.coverImage}
              onChange={(e) => set("coverImage", e.target.value)}
              dir="ltr"
            />
          </div>
        </div>

        <div className="glass-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">محتوا</h2>
          <RichEditor
            content={form.content}
            onChange={(html) => set("content", html)}
            placeholder="محتوای پست را اینجا بنویسید..."
          />
        </div>

        <div className="glass-card p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">SEO</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              عنوان SEO
            </label>
            <input
              className="input-base w-full"
              placeholder="عنوان برای موتورهای جستجو"
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              توضیحات SEO
            </label>
            <textarea
              className="input-base w-full resize-none"
              rows={3}
              placeholder="توضیحات متا برای موتورهای جستجو..."
              value={form.seoDesc}
              onChange={(e) => set("seoDesc", e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card p-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-gray-800 dark:text-white">انتشار</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {form.isPublished ? "پست منتشر خواهد شد" : "به عنوان پیش‌نویس ذخیره می‌شود"}
              </p>
            </div>
            <div
              onClick={() => set("isPublished", !form.isPublished)}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                form.isPublished ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  form.isPublished ? "right-0.5" : "right-6"
                }`}
              />
            </div>
          </label>
        </div>
      </form>
    </div>
  );
}
