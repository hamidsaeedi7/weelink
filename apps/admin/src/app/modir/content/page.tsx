"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import RichEditor from "@/components/editor/RichEditor";

const TABS = [
  { id: "about", label: "درباره ما" },
  { id: "contact", label: "تماس با ما" },
  { id: "header", label: "هدر" },
  { id: "footer", label: "فوتر" },
];

interface NavLink { label: string; href: string }
interface SocialLinks { instagram: string; telegram: string; twitter: string }

interface ContentData {
  content?: string;
  logoText?: string;
  navLinks?: NavLink[];
  phone?: string;
  address?: string;
  description?: string;
  socialLinks?: SocialLinks;
  copyrightText?: string;
  showEnamad?: boolean;
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState("about");
  const [data, setData] = useState<ContentData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadContent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const result = await adminApi.getContent(id);
      setData(result ?? {});
    } catch {
      toast.error("خطا در بارگذاری محتوا");
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent(activeTab);
  }, [activeTab, loadContent]);

  const set = (key: string, value: unknown) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateContent(activeTab, data);
      toast.success("محتوا ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره محتوا");
    } finally {
      setSaving(false);
    }
  };

  const addNavLink = () =>
    set("navLinks", [...(data.navLinks ?? []), { label: "", href: "" }]);

  const updateNavLink = (index: number, field: "label" | "href", value: string) => {
    const updated = [...(data.navLinks ?? [])];
    updated[index] = { ...updated[index], [field]: value };
    set("navLinks", updated);
  };

  const removeNavLink = (index: number) =>
    set("navLinks", (data.navLinks ?? []).filter((_, i) => i !== index));

  const setSocial = (key: keyof SocialLinks, value: string) =>
    set("socialLinks", { ...(data.socialLinks ?? { instagram: "", telegram: "", twitter: "" }), [key]: value });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ویرایش محتوا</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">مدیریت محتوای صفحات سایت</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "در حال ذخیره..." : "ذخیره"}
        </button>
      </div>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="glass-card p-6 space-y-5">
          {(activeTab === "about" || activeTab === "contact") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                محتوا
              </label>
              <RichEditor
                content={data.content ?? ""}
                onChange={(html) => set("content", html)}
              />
            </div>
          )}

          {activeTab === "header" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  متن لوگو
                </label>
                <input
                  className="input-base w-full"
                  value={data.logoText ?? ""}
                  onChange={(e) => set("logoText", e.target.value)}
                  placeholder="نام سایت"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  شماره تماس
                </label>
                <input
                  className="input-base w-full"
                  value={data.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  آدرس
                </label>
                <input
                  className="input-base w-full"
                  value={data.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="تهران، ..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    لینک‌های منو
                  </label>
                  <button
                    type="button"
                    onClick={addNavLink}
                    className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus size={14} />
                    افزودن لینک
                  </button>
                </div>
                <div className="space-y-2">
                  {(data.navLinks ?? []).map((link, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className="input-base flex-1"
                        placeholder="عنوان"
                        value={link.label}
                        onChange={(e) => updateNavLink(i, "label", e.target.value)}
                      />
                      <input
                        className="input-base flex-1 font-mono text-sm"
                        placeholder="/path"
                        value={link.href}
                        onChange={(e) => updateNavLink(i, "href", e.target.value)}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => removeNavLink(i)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {(data.navLinks ?? []).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">لینکی اضافه نشده</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  توضیحات فوتر
                </label>
                <textarea
                  className="input-base w-full resize-none"
                  rows={3}
                  value={data.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="توضیح کوتاهی درباره سایت..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  شبکه‌های اجتماعی
                </label>
                <div className="space-y-2">
                  {(["instagram", "telegram", "twitter"] as const).map((platform) => (
                    <div key={platform} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right capitalize">
                        {platform === "instagram" ? "اینستاگرام" : platform === "telegram" ? "تلگرام" : "توییتر"}
                      </span>
                      <input
                        className="input-base flex-1 font-mono text-sm"
                        placeholder={`https://${platform}.com/...`}
                        value={data.socialLinks?.[platform] ?? ""}
                        onChange={(e) => setSocial(platform, e.target.value)}
                        dir="ltr"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  متن کپی‌رایت
                </label>
                <input
                  className="input-base w-full"
                  value={data.copyrightText ?? ""}
                  onChange={(e) => set("copyrightText", e.target.value)}
                  placeholder="© ۱۴۰۴ تمامی حقوق محفوظ است"
                />
              </div>

              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">نمایش نماد اعتماد (اینماد)</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      نماد الکترونیکی اعتماد در فوتر نمایش داده شود
                    </p>
                  </div>
                  <div
                    onClick={() => set("showEnamad", !data.showEnamad)}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                      data.showEnamad ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        data.showEnamad ? "right-0.5" : "right-6"
                      }`}
                    />
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* پیش‌نمایش زنده — همزمان با تایپ به‌روز می‌شود */}
        <LivePreview tab={activeTab} data={data} />
        </div>
      )}
    </div>
  );
}

/** پیش‌نمایش زنده هر بخش، با ظاهری نزدیک به خود سایت. */
function LivePreview({ tab, data }: { tab: string; data: ContentData }) {
  return (
    <div className="xl:sticky xl:top-6 space-y-2">
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        پیش‌نمایش زنده — تغییرات همین لحظه اعمال می‌شوند (برای انتشار، ذخیره را بزنید)
      </p>
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0F]" dir="rtl">
        {tab === "header" && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-6">
              <span className="font-black text-white">{data.logoText || "ویلینک"}</span>
              <nav className="hidden sm:flex items-center gap-4">
                {(data.navLinks ?? []).map((l, i) => (
                  <span key={i} className="text-sm text-gray-400 hover:text-orange-400 cursor-pointer">{l.label || "—"}</span>
                ))}
              </nav>
            </div>
            {data.phone && <span className="text-sm text-orange-400 font-mono" dir="ltr">{data.phone}</span>}
          </div>
        )}

        {(tab === "about" || tab === "contact") && (
          <div className="p-6">
            <h2 className="text-lg font-black text-white mb-4">{tab === "about" ? "درباره ما" : "تماس با ما"}</h2>
            <div
              className="prose prose-invert prose-sm max-w-none text-gray-300 [&_a]:text-orange-400"
              dangerouslySetInnerHTML={{ __html: data.content || "<p class='text-gray-500'>محتوایی وارد نشده…</p>" }}
            />
            {tab === "contact" && data.address && (
              <p className="mt-4 text-sm text-gray-400">آدرس: {data.address}</p>
            )}
          </div>
        )}

        {tab === "footer" && (
          <div className="p-6 space-y-4 border-t border-white/10">
            <p className="text-sm text-gray-400 leading-relaxed">{data.description || "توضیح فوتر…"}</p>
            <div className="flex items-center gap-3">
              {(["instagram", "telegram", "twitter"] as const).map((p) =>
                data.socialLinks?.[p] ? (
                  <span key={p} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400">
                    {p === "instagram" ? "IG" : p === "telegram" ? "TG" : "X"}
                  </span>
                ) : null,
              )}
              {data.showEnamad && (
                <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[9px] text-gray-400">اینماد</span>
              )}
            </div>
            <p className="text-xs text-gray-600 border-t border-white/5 pt-3">{data.copyrightText || "© تمامی حقوق محفوظ است"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
