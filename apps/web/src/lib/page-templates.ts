import type { BlockType } from "@/components/blocks/block-types";
import type { BioThemeId, BioModeId } from "@/lib/bio-theme";

/**
 * Ready-made page templates.
 *
 * A template is *content*, not styling: it is the exact list of blocks a page
 * of that kind needs, pre-filled with realistic Persian demo copy, plus the
 * theme/mode/accent that suits it. Applying one creates real Block rows the
 * seller then edits normally — there is no separate "template mode" to get
 * stuck in, and nothing here can drift from how the public page renders.
 *
 * Demo rows deliberately ship without images. A placeholder photo of someone
 * else's product looks worse than an empty frame and invites sellers to
 * publish a page that is not theirs; the empty frame prompts them to upload.
 * Numbers left empty ("") are the seller's own to fill — no invented stats.
 */

export interface TemplateBlock {
  type: BlockType;
  label?: string;
  url?: string;
  icon?: string;
  data?: Record<string, any>;
}

export interface PageTemplate {
  id: string;
  label: string;
  /** business category shown as a chip in the gallery */
  industry: string;
  description: string;
  isPro: boolean;
  theme: BioThemeId;
  mode: BioModeId;
  primaryColor: string;
  blocks: TemplateBlock[];
}

// Shared fragments — several templates need the same trust bar or social row,
// and duplicating them across 12 literals is how they drift out of sync.
const trust = (
  a: [string, string, string],
  b: [string, string, string],
  c: [string, string, string],
): TemplateBlock => ({
  type: "TRUST_BAR",
  data: {
    items: [
      { icon: a[0], title: a[1], subtitle: a[2] },
      { icon: b[0], title: b[1], subtitle: b[2] },
      { icon: c[0], title: c[1], subtitle: c[2] },
    ],
  },
});

const socials = (platforms: string[]): TemplateBlock => ({
  type: "SOCIAL_ROW",
  data: { style: "icon", items: platforms.map((p) => ({ platform: p, url: "" })) },
});

const autoProducts = (label: string): TemplateBlock => ({
  type: "PRODUCT_GRID",
  label,
  data: { source: "auto", limit: 6, columns: "2", moreLabel: "مشاهده همه" },
});

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ─── رایگان ───────────────────────────────────────────────────────────────
  {
    id: "shop-general",
    label: "فروشگاه عمومی",
    industry: "فروشگاه",
    description: "هدر، دسته‌بندی، محصولات و دکمه سفارش — مناسب هر فروشگاهی",
    isPro: false,
    theme: "modern",
    mode: "dark",
    primaryColor: "#22C55E",
    blocks: [
      { type: "HERO", label: "فروشگاه من", data: { subtitle: "خرید آسان، ارسال سریع به سراسر کشور", height: "md", overlay: "60", ctaLabel: "مشاهده محصولات" } },
      trust(["truck", "ارسال سریع", "۱ تا ۳ روز کاری"], ["shield-check", "ضمانت اصالت", "کالای اورجینال"], ["rotate-ccw", "بازگشت کالا", "تا ۷ روز"]),
      {
        type: "CATEGORY_CHIPS", label: "دسته‌بندی‌ها",
        data: {
          shape: "circle",
          items: [
            { title: "پرفروش‌ها", icon: "flame" }, { title: "جدیدها", icon: "sparkles" },
            { title: "تخفیف‌دار", icon: "percent" }, { title: "همه محصولات", icon: "grid" },
          ],
        },
      },
      autoProducts("محصولات ویژه"),
      { type: "WHATSAPP", label: "سفارش در واتساپ", data: { phone: "", message: "سلام، می‌خوام سفارش بدم" } },
      socials(["instagram", "telegram", "whatsapp"]),
      {
        type: "BOTTOM_NAV",
        data: { items: [{ title: "خانه", icon: "home" }, { title: "محصولات", icon: "shopping-bag" }, { title: "سبد خرید", icon: "shopping-cart" }, { title: "تماس", icon: "phone" }] },
      },
    ],
  },
  {
    id: "services",
    label: "خدمات و مشاوره",
    industry: "خدمات",
    description: "معرفی خدمات، لیست قیمت و رزرو مشاوره",
    isPro: false,
    theme: "minimal",
    mode: "light",
    primaryColor: "#0EA88A",
    blocks: [
      { type: "HERO", label: "خدمات حرفه‌ای", data: { subtitle: "با تجربه و تعهد، کنار شما", height: "sm", overlay: "60", ctaLabel: "رزرو مشاوره رایگان" } },
      {
        type: "CATEGORY_CHIPS", label: "خدمات من",
        data: {
          shape: "rounded",
          items: [
            { title: "مشاوره", icon: "message-circle" }, { title: "اجرا", icon: "wrench" },
            { title: "پشتیبانی", icon: "headphones" }, { title: "آموزش", icon: "book-open" },
          ],
        },
      },
      {
        type: "PRICE_LIST", label: "لیست خدمات و قیمت‌ها",
        data: {
          items: [
            { title: "مشاوره اولیه", subtitle: "۳۰ دقیقه گفتگو", value: "رایگان" },
            { title: "بستهٔ شروع", subtitle: "راه‌اندازی قدم به قدم", value: "۴۹۹٬۰۰۰ تومان" },
            { title: "بستهٔ حرفه‌ای", subtitle: "اجرا و پشتیبانی کامل", value: "۱٬۹۹۰٬۰۰۰ تومان" },
          ],
        },
      },
      { type: "TESTIMONIAL", label: "نظر مشتریان", data: { items: [{ text: "همکاری بسیار حرفه‌ای بود و نتیجه فراتر از انتظارم شد.", name: "نام مشتری", role: "مشتری", rating: "5" }] } },
      { type: "HOURS", label: "ساعت کاری", data: { address: "", items: [{ title: "شنبه تا چهارشنبه", value: "۹:۰۰ تا ۱۸:۰۰" }, { title: "پنجشنبه", value: "۹:۰۰ تا ۱۳:۰۰" }, { title: "جمعه", value: "تعطیل" }] } },
      { type: "BUTTON_ROW", label: "رزرو نوبت", url: "", data: { primaryIcon: "calendar-check", secondaryLabel: "تماس با ما", secondaryUrl: "", secondaryIcon: "phone" } },
      socials(["instagram", "telegram", "linkedin"]),
    ],
  },
  {
    id: "cafe",
    label: "کافه و رستوران",
    industry: "کافه",
    description: "منو، گالری فضا، آدرس و رزرو میز",
    isPro: false,
    theme: "clay",
    mode: "dark",
    primaryColor: "#C08A4E",
    blocks: [
      { type: "HERO", label: "کافه من", data: { subtitle: "قهوه، دسر و لحظه‌های خوب", height: "md", overlay: "60", ctaLabel: "مشاهده منو" } },
      { type: "BUTTON_ROW", label: "سفارش آنلاین", url: "", data: { primaryIcon: "shopping-cart", secondaryLabel: "رزرو میز", secondaryUrl: "", secondaryIcon: "calendar" } },
      {
        type: "PRICE_LIST", label: "منوی محبوب",
        data: {
          items: [
            { title: "کاپوچینو", value: "۱۷۰٬۰۰۰ تومان" }, { title: "لاته کارامل", value: "۱۶۰٬۰۰۰ تومان" },
            { title: "کیک شکلاتی", value: "۱۴۵٬۰۰۰ تومان" }, { title: "موس توت‌فرنگی", value: "۱۵۰٬۰۰۰ تومان" },
          ],
        },
      },
      { type: "GALLERY", label: "فضای کافه", data: { columns: "3", ratio: "square", items: [] } },
      { type: "HOURS", label: "ساعت کاری و آدرس", data: { address: "آدرس کافه را اینجا بنویسید", items: [{ title: "هر روز", value: "۸:۰۰ تا ۲۳:۰۰" }] } },
      socials(["instagram", "telegram", "whatsapp"]),
    ],
  },
  {
    id: "personal",
    label: "پیج شخصی",
    industry: "شخصی",
    description: "معرفی کوتاه، لینک‌ها و راه‌های ارتباطی",
    isPro: false,
    theme: "glass",
    mode: "dark",
    primaryColor: "#7C6CF0",
    blocks: [
      { type: "TEXT", data: { content: "سلام! اینجا همهٔ لینک‌های من یک‌جا جمع شده." } },
      socials(["instagram", "telegram", "youtube", "linkedin"]),
      { type: "FEATURED", label: "جدیدترین محتوای من", url: "", icon: "⭐" },
      { type: "LINK", label: "وب‌سایت من", url: "", icon: "🌐" },
      { type: "TESTIMONIAL", label: "نظرها", data: { items: [{ text: "محتوای بسیار مفیدی داری، ممنون!", name: "نام مخاطب", rating: "5" }] } },
      { type: "EMAIL_CAPTURE", label: "عضویت در خبرنامه", data: { placeholder: "ایمیل شما" } },
    ],
  },

  // ─── Pro ──────────────────────────────────────────────────────────────────
  {
    id: "sport",
    label: "لوازم ورزشی و سفر",
    industry: "ورزشی",
    description: "هدر ماجراجویانه، دسته‌بندی تجهیزات و گرید محصول",
    isPro: true,
    theme: "modern",
    mode: "dark",
    primaryColor: "#4ADE80",
    blocks: [
      { type: "HERO", label: "تجهیزات ورزش و سفر", data: { subtitle: "همراه مطمئن ماجراجویی‌های تو", height: "lg", overlay: "60", ctaLabel: "مشاهده محصولات" } },
      {
        type: "CATEGORY_CHIPS",
        data: {
          shape: "rounded",
          items: [
            { title: "کوله‌پشتی", icon: "package" }, { title: "چادر", icon: "trees" },
            { title: "کفش", icon: "shirt" }, { title: "ساعت", icon: "watch" }, { title: "سایر", icon: "grid" },
          ],
        },
      },
      autoProducts("محصولات ویژه"),
      trust(["truck", "ارسال سریع", "۱ تا ۲ روز کاری"], ["rotate-ccw", "ضمانت بازگشت", "۷ روز"], ["credit-card", "پرداخت امن", "درگاه معتبر"]),
      { type: "BUTTON_ROW", label: "مشاهده محصولات", url: "", data: { primaryIcon: "shopping-bag", secondaryLabel: "مشاوره خرید", secondaryUrl: "", secondaryIcon: "headphones" } },
      {
        type: "BOTTOM_NAV",
        data: { items: [{ title: "خانه", icon: "home" }, { title: "محصولات", icon: "shopping-bag" }, { title: "دسته‌بندی", icon: "grid" }, { title: "سبد خرید", icon: "shopping-cart" }, { title: "پروفایل", icon: "users" }] },
      },
    ],
  },
  {
    id: "jewelry",
    label: "طلا و جواهر",
    industry: "طلا",
    description: "ویترین لوکس، نرخ روز و مشاورهٔ خرید",
    isPro: true,
    theme: "modern",
    mode: "dark",
    primaryColor: "#D4A537",
    blocks: [
      { type: "HERO", label: "گالری طلا و جواهر", data: { subtitle: "طراحی خاص، درخشش همیشگی", height: "md", overlay: "60" } },
      trust(["badge-check", "ضمانت اصالت", "طلای ۱۸ عیار"], ["shield-check", "ارسال بیمه‌شده", "سراسر کشور"], ["gem", "طراحی اختصاصی", "به سفارش شما"]),
      {
        type: "CATEGORY_CHIPS",
        data: {
          shape: "circle",
          items: [
            { title: "انگشتر", icon: "gem" }, { title: "گردنبند", icon: "sparkles" },
            { title: "گوشواره", icon: "star" }, { title: "دستبند", icon: "watch" },
          ],
        },
      },
      autoProducts("پرفروش‌ترین‌ها"),
      { type: "PRICE_LIST", label: "نرخ روز", data: { items: [{ title: "طلای ۱۸ عیار", subtitle: "هر گرم", value: "" }, { title: "سکه امامی", value: "" }] } },
      { type: "BUTTON_ROW", label: "مشاوره در واتساپ", url: "", data: { primaryIcon: "message-circle", secondaryLabel: "تماس با ما", secondaryUrl: "", secondaryIcon: "phone" } },
    ],
  },
  {
    id: "fashion",
    label: "مد و پوشاک",
    industry: "پوشاک",
    description: "کالکشن فصل، راهنمای سایز و خرید سریع",
    isPro: true,
    theme: "minimal",
    mode: "light",
    primaryColor: "#B08968",
    blocks: [
      { type: "HERO", label: "استایل خاص، برای شما", data: { subtitle: "کالکشن جدید فصل", height: "lg", overlay: "30", ctaLabel: "مشاهده کالکشن" } },
      {
        type: "CATEGORY_CHIPS",
        data: {
          shape: "circle",
          items: [
            { title: "مردانه", icon: "shirt" }, { title: "زنانه", icon: "shirt" },
            { title: "کیف و کفش", icon: "shopping-bag" }, { title: "اکسسوری", icon: "watch" },
          ],
        },
      },
      autoProducts("جدیدترین کالکشن"),
      { type: "FAQ", label: "راهنمای سایز", data: { answer: "برای انتخاب بهتر، جدول سایزبندی را ببینید یا در واتساپ از ما بپرسید." } },
      { type: "BUTTON_ROW", label: "تسویه و خرید", url: "", data: { primaryIcon: "shopping-cart", secondaryLabel: "پیام در واتساپ", secondaryUrl: "", secondaryIcon: "message-circle" } },
      socials(["instagram", "telegram", "whatsapp"]),
    ],
  },
  {
    id: "beauty",
    label: "آرایشی و بهداشتی",
    industry: "زیبایی",
    description: "محصولات مراقبتی، مشاورهٔ پوست و نظر مشتریان",
    isPro: true,
    theme: "clay",
    mode: "light",
    primaryColor: "#E48AA8",
    blocks: [
      { type: "HERO", label: "زیبایی شما، امضای ما", data: { subtitle: "محصولات آرایشی و مراقبتی باکیفیت", height: "md", overlay: "30" } },
      {
        type: "CATEGORY_CHIPS",
        data: {
          shape: "circle",
          items: [
            { title: "مراقبت از پوست", icon: "sparkles" }, { title: "مراقبت از مو", icon: "brush" },
            { title: "آرایش", icon: "palette" }, { title: "عطر و ادکلن", icon: "gem" },
          ],
        },
      },
      autoProducts("محصولات ویژه"),
      { type: "STATS", data: { items: [{ value: "۵۰۰+", title: "مشتری راضی", icon: "users" }, { value: "۴٫۹", title: "میانگین امتیاز", icon: "star" }, { value: "۷ روز", title: "ضمانت بازگشت", icon: "rotate-ccw" }] } },
      { type: "TESTIMONIAL", label: "نظر مشتریان", data: { items: [{ text: "کیفیت محصولات عالی بود و خیلی سریع به دستم رسید.", name: "نام مشتری", rating: "5" }] } },
      { type: "BUTTON_ROW", label: "رزرو مشاوره رایگان", url: "", data: { primaryIcon: "message-circle", secondaryLabel: "تماس با ما", secondaryUrl: "", secondaryIcon: "phone" } },
    ],
  },
  {
    id: "realestate",
    label: "مشاور املاک",
    industry: "املاک",
    description: "خرید و فروش، فایل‌های ویژه و رزرو بازدید",
    isPro: true,
    theme: "modern",
    mode: "dark",
    primaryColor: "#2DD4BF",
    blocks: [
      { type: "HERO", label: "مشاور املاک شما", data: { subtitle: "اعتماد شما، مسئولیت ما", height: "md", overlay: "60" } },
      { type: "STATS", data: { items: [{ value: "۸۵۰+", title: "معاملهٔ موفق", icon: "badge-check" }, { value: "۶۲۰+", title: "ملک فعال", icon: "home" }, { value: "۴٫۹", title: "امتیاز کاربران", icon: "star" }] } },
      {
        type: "CATEGORY_CHIPS",
        data: {
          shape: "rounded",
          items: [
            { title: "خرید", icon: "home" }, { title: "فروش", icon: "tag" },
            { title: "رهن و اجاره", icon: "wallet" }, { title: "پروژه‌ها", icon: "building" },
          ],
        },
      },
      autoProducts("فایل‌های ویژه"),
      trust(["shield-check", "امنیت معامله", "قرارداد رسمی"], ["file-text", "اطلاعات دقیق", "بررسی کارشناسی"], ["user-check", "مشاور حرفه‌ای", "تجربه و تخصص"]),
      { type: "BUTTON_ROW", label: "رزرو بازدید ملک", url: "", data: { primaryIcon: "calendar-check", secondaryLabel: "تماس با ما", secondaryUrl: "", secondaryIcon: "phone" } },
    ],
  },
  {
    id: "auto",
    label: "خودرو و تعمیرگاه",
    industry: "خودرو",
    description: "خدمات فنی، رزرو نوبت و لیست قیمت",
    isPro: true,
    theme: "modern",
    mode: "dark",
    primaryColor: "#3B82F6",
    blocks: [
      { type: "HERO", label: "تعمیرگاه تخصصی خودرو", data: { subtitle: "تخصص، دقت، اعتماد", height: "md", overlay: "60", ctaLabel: "رزرو آنلاین نوبت" } },
      {
        type: "CATEGORY_CHIPS",
        data: {
          shape: "rounded",
          items: [
            { title: "سرویس دوره‌ای", icon: "wrench" }, { title: "برق خودرو", icon: "zap" },
            { title: "موتور", icon: "car" }, { title: "امداد", icon: "phone" },
          ],
        },
      },
      {
        type: "PRICE_LIST", label: "لیست خدمات و قیمت",
        data: { items: [{ title: "تعویض روغن", value: "۴۵۰٬۰۰۰ تومان" }, { title: "بالانس و تنظیم فرمان", value: "۶۰۰٬۰۰۰ تومان" }, { title: "دیاگ کامل", value: "۸۰۰٬۰۰۰ تومان" }] },
      },
      { type: "HOURS", label: "ساعت کاری و آدرس", data: { address: "", items: [{ title: "شنبه تا پنجشنبه", value: "۸:۰۰ تا ۱۹:۰۰" }, { title: "جمعه", value: "۹:۰۰ تا ۱۴:۰۰" }] } },
      { type: "TESTIMONIAL", label: "نظر مشتریان", data: { items: [{ text: "کارشون تمیز و منصفانه بود، حتماً دوباره مراجعه می‌کنم.", name: "نام مشتری", rating: "5" }] } },
      { type: "BUTTON_ROW", label: "رزرو نوبت", url: "", data: { primaryIcon: "calendar-check", secondaryLabel: "تماس فوری", secondaryUrl: "", secondaryIcon: "phone" } },
    ],
  },
  {
    id: "kids",
    label: "اسباب‌بازی و کودک",
    industry: "کودک",
    description: "دسته‌بندی سنی، محصولات ایمن و مشاوره با والدین",
    isPro: true,
    theme: "clay",
    mode: "light",
    primaryColor: "#38BDF8",
    blocks: [
      { type: "HERO", label: "اسباب‌بازی و کودک", data: { subtitle: "بازی، یادگیری، رشد", height: "md", overlay: "30" } },
      {
        type: "CATEGORY_CHIPS", label: "بر اساس سن",
        data: {
          shape: "pill",
          items: [{ title: "۰ تا ۲ سال" }, { title: "۲ تا ۵ سال" }, { title: "۵ تا ۸ سال" }, { title: "۸ سال به بالا" }],
        },
      },
      trust(["shield-check", "ایمن و استاندارد", "بدون مواد مضر"], ["sparkles", "توسعهٔ مهارت", "بازی هدفمند"], ["badge-check", "کیفیت تضمینی", "برندهای معتبر"]),
      autoProducts("محصولات پیشنهادی"),
      { type: "BUTTON_ROW", label: "مشاوره با والدین", url: "", data: { primaryIcon: "message-circle", secondaryLabel: "تماس با ما", secondaryUrl: "", secondaryIcon: "phone" } },
      socials(["instagram", "telegram", "whatsapp"]),
    ],
  },
  {
    id: "education",
    label: "مدرس و دوره آموزشی",
    industry: "آموزش",
    description: "معرفی دوره‌ها، نظر دانشجویان و ثبت‌نام",
    isPro: true,
    theme: "glass",
    mode: "dark",
    primaryColor: "#8B5CF6",
    blocks: [
      { type: "HERO", label: "دوره‌های آموزشی", data: { subtitle: "یاد بگیر، تمرین کن، نتیجه بگیر", height: "md", overlay: "60", ctaLabel: "مشاهده دوره‌ها" } },
      { type: "STATS", data: { items: [{ value: "۳٬۲۰۰+", title: "دانشجو", icon: "users" }, { value: "۱۲", title: "دوره", icon: "book-open" }, { value: "۴٫۹", title: "امتیاز", icon: "star" }] } },
      autoProducts("دوره‌های محبوب"),
      { type: "TESTIMONIAL", label: "نظر دانشجویان", data: { items: [{ text: "این دوره واقعاً کاربردی بود و خیلی چیزها یاد گرفتم.", name: "نام دانشجو", rating: "5" }] } },
      { type: "FAQ", label: "دسترسی به دوره‌ها چقدر است؟", data: { answer: "پس از ثبت‌نام، دسترسی دائمی به دوره و آپدیت‌های آینده دارید." } },
      { type: "EMAIL_CAPTURE", label: "خبر دوره‌های جدید", data: { placeholder: "ایمیل شما" } },
      { type: "BUTTON_ROW", label: "ثبت‌نام و شروع یادگیری", url: "", data: { primaryIcon: "graduation-cap", secondaryLabel: "مشاورهٔ رایگان", secondaryUrl: "", secondaryIcon: "message-circle" } },
    ],
  },
];

export function getPageTemplate(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_INDUSTRIES = Array.from(new Set(PAGE_TEMPLATES.map((t) => t.industry)));
