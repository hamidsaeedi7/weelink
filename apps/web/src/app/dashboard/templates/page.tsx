"use client";

import { useState } from "react";
import { Loader2, LayoutTemplate, Check } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

const TEMPLATES = [
  {
    id: "doctor",
    label: "دکتر / پزشک",
    emoji: "🏥",
    color: "from-blue-500/20 to-cyan-500/20",
    accentColor: "#3B82F6",
    desc: "ویزیت آنلاین، نوبت‌دهی، آدرس مطب",
    blocks: [
      { type: "TEXT", label: "بیوگرافی", data: { content: "دکتر متخصص — مشاوره پزشکی آنلاین و حضوری" } },
      { type: "PHONE", label: "تماس با مطب", url: "09120000000" },
      { type: "MAP", label: "آدرس مطب", url: "https://maps.google.com", icon: "📍" },
      { type: "WHATSAPP", label: "نوبت‌گیری واتساپ", data: { phone: "989120000000", message: "سلام، میخوام نوبت بگیرم" } },
      { type: "FAQ", label: "ساعات کاری مطب", data: { answer: "شنبه تا چهارشنبه ۹ تا ۱۷" } },
    ],
  },
  {
    id: "coach",
    label: "مربی ورزشی",
    emoji: "💪",
    color: "from-orange-500/20 to-red-500/20",
    accentColor: "#F97316",
    desc: "برنامه تمرین، مشاوره آنلاین، کلاس‌ها",
    blocks: [
      { type: "TEXT", label: "معرفی کوچ", data: { content: "مربی تخصصی فیتنس و تناسب اندام" } },
      { type: "FEATURED", label: "ثبت‌نام کلاس آنلاین", url: "#", icon: "⚡" },
      { type: "VIDEO", label: "تمرین رایگان", url: "https://youtube.com", data: { platform: "youtube" } },
      { type: "WHATSAPP", label: "مشاوره رایگان", data: { phone: "989120000000", message: "میخوام مشاوره رایگان بگیرم" } },
      { type: "MESSENGER", label: "کانال تلگرام", data: { platform: "telegram" }, url: "t.me/channel" },
    ],
  },
  {
    id: "shop_insta",
    label: "فروشگاه اینستا",
    emoji: "🛍️",
    color: "from-pink-500/20 to-purple-500/20",
    accentColor: "#EC4899",
    desc: "محصولات، سفارش واتساپ، تخفیف‌ها",
    blocks: [
      { type: "TEXT", label: "معرفی فروشگاه", data: { content: "فروش آنلاین محصولات اورجینال" } },
      { type: "FEATURED", label: "مشاهده محصولات", url: "#", icon: "🛍️" },
      { type: "FLASH_SALE", label: "حراج ویژه", data: { discount: "۳۰", description: "فقط تا آخر هفته!", endDate: "" } },
      { type: "WHATSAPP", label: "ثبت سفارش", data: { phone: "989120000000", message: "میخوام سفارش بدم" } },
      { type: "MESSENGER", label: "کانال اطلاع‌رسانی", data: { platform: "telegram" }, url: "t.me/channel" },
    ],
  },
  {
    id: "realstate",
    label: "مشاور املاک",
    emoji: "🏠",
    color: "from-green-500/20 to-emerald-500/20",
    accentColor: "#10B981",
    desc: "آگهی‌ها، تماس، آدرس دفتر",
    blocks: [
      { type: "TEXT", label: "معرفی مشاور", data: { content: "مشاور رسمی املاک — خرید، فروش، رهن و اجاره" } },
      { type: "PHONE", label: "تماس مستقیم", url: "09120000000" },
      { type: "FEATURED", label: "آگهی‌های موجود", url: "#", icon: "🏠" },
      { type: "WHATSAPP", label: "مشاوره رایگان", data: { phone: "989120000000", message: "نیاز به مشاوره دارم" } },
      { type: "MAP", label: "آدرس دفتر", url: "https://maps.google.com" },
    ],
  },
  {
    id: "cafe",
    label: "کافه / رستوران",
    emoji: "☕",
    color: "from-amber-500/20 to-yellow-500/20",
    accentColor: "#F59E0B",
    desc: "منو، رزرو میز، اینستاگرام",
    blocks: [
      { type: "TEXT", label: "معرفی کافه", data: { content: "کافه‌ای دنج در قلب شهر" } },
      { type: "FEATURED", label: "مشاهده منو", url: "#", icon: "☕" },
      { type: "PHONE", label: "رزرو میز", url: "09120000000" },
      { type: "MAP", label: "موقعیت کافه", url: "https://maps.google.com" },
      { type: "MESSENGER", label: "اینستاگرام ما", data: { platform: "telegram" }, url: "https://instagram.com" },
    ],
  },
  {
    id: "photographer",
    label: "عکاس / فیلمساز",
    emoji: "📸",
    color: "from-violet-500/20 to-purple-500/20",
    accentColor: "#8B5CF6",
    desc: "پرتفولیو، رزرو، قیمت‌ها",
    blocks: [
      { type: "TEXT", label: "معرفی هنرمند", data: { content: "عکاسی تخصصی عروسی، پرتره و تجاری" } },
      { type: "IMAGE", label: "نمونه کارها", data: { imageUrl: "" } },
      { type: "FEATURED", label: "مشاهده پرتفولیو", url: "#", icon: "📸" },
      { type: "WHATSAPP", label: "رزرو عکاسی", data: { phone: "989120000000", message: "میخوام رزرو عکاسی کنم" } },
      { type: "LINK", label: "قیمت‌ها و پکیج‌ها", url: "#", icon: "💰" },
    ],
  },
  {
    id: "blank",
    label: "شروع از صفر",
    emoji: "✨",
    color: "from-gray-500/10 to-gray-400/10",
    accentColor: "#6B7280",
    desc: "صفحه خالی بدون بلوک پیش‌فرض",
    blocks: [],
  },
];

export default function TemplatesPage() {
  const [applying, setApplying] = useState<string | null>(null);
  const router = useRouter();

  const applyTemplate = async (tpl: typeof TEMPLATES[0]) => {
    if (applying) return;
    if (tpl.id === "blank") {
      router.push("/dashboard/blocks");
      return;
    }
    if (!confirm(`قالب «${tpl.label}» اعمال شود؟ بلوک‌های فعلی شما جایگزین می‌شوند.`)) return;

    setApplying(tpl.id);
    try {
      const existing = await fetch(`${API}/api/v1/blocks`, { headers: auth() }).then((r) => r.json());
      const existingBlocks = existing.data || existing || [];
      await Promise.all(existingBlocks.map((b: any) =>
        fetch(`${API}/api/v1/blocks/${b.id}`, { method: "DELETE", headers: auth() })
      ));
      for (let i = 0; i < tpl.blocks.length; i++) {
        await fetch(`${API}/api/v1/blocks`, {
          method: "POST",
          headers: { ...auth(), "Content-Type": "application/json" },
          body: JSON.stringify({ ...tpl.blocks[i], sortOrder: i }),
        });
      }
      toast.success("قالب اعمال شد!");
      router.push("/dashboard/blocks");
    } catch {
      toast.error("خطا در اعمال قالب");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">قالب‌های حرفه‌ای</h1>
        <p className="text-sm text-gray-500">یک کلیک — صفحه بیو آماده برای شغل شما</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => (
          <div key={tpl.id}
            className="glass-card overflow-hidden group cursor-pointer hover:border-orange-500/30 transition-all"
            onClick={() => applyTemplate(tpl)}>
            <div className={`h-28 bg-gradient-to-br ${tpl.color} flex items-center justify-center text-5xl transition-transform group-hover:scale-105`}>
              {tpl.emoji}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">{tpl.label}</h3>
                {tpl.blocks.length > 0 && (
                  <span className="text-xs text-gray-400">{tpl.blocks.length} بلوک</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{tpl.desc}</p>

              {tpl.blocks.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tpl.blocks.slice(0, 3).map((b, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-md">
                      {b.type}
                    </span>
                  ))}
                  {tpl.blocks.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{tpl.blocks.length - 3}</span>
                  )}
                </div>
              )}

              <button
                disabled={applying === tpl.id}
                className="w-full mt-2 py-2 rounded-xl text-sm font-medium transition-all
                           border border-gray-200 dark:border-white/10
                           hover:text-white hover:border-transparent"
                style={{ background: applying === tpl.id ? "#F97316" : "" }}
                onClick={(e) => { e.stopPropagation(); applyTemplate(tpl); }}>
                {applying === tpl.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> در حال اعمال...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> استفاده از این قالب
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
