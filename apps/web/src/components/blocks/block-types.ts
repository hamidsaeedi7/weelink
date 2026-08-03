export type BlockType =
  | "LINK" | "GROUP" | "IMAGE" | "TEXT" | "VIDEO"
  | "PHONE" | "EMAIL_BLOCK" | "MESSENGER" | "MAP"
  | "MUSIC" | "PODCAST" | "FAQ" | "REDIRECT" | "FEATURED"
  | "EMAIL_CAPTURE" | "DIVIDER"
  | "ORDER_FORM" | "FLASH_SALE" | "WHATSAPP"
  // مینی‌سایت
  | "HERO" | "TRUST_BAR" | "CATEGORY_CHIPS" | "PRODUCT_GRID"
  | "GALLERY" | "TESTIMONIAL" | "STATS" | "SOCIAL_ROW"
  | "HOURS" | "PRICE_LIST" | "BUTTON_ROW" | "BOTTOM_NAV";

/**
 * Blocks are grouped in the picker so the list stays scannable now that it
 * holds 27 types. "site" blocks are the mini-site structural pieces added
 * with the template system; the rest keep their original meaning.
 */
export type BlockCategory = "link" | "site" | "sell" | "content";

export const BLOCK_CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: "site", label: "ساختار مینی‌سایت" },
  { id: "link", label: "لینک و ارتباط" },
  { id: "sell", label: "فروش" },
  { id: "content", label: "محتوا" },
];

export interface BlockDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  color: string;
  fields: FieldDef[];
  /** default `data` applied when the block is created, so a fresh block is never blank */
  defaults?: Record<string, any>;
}

export interface FieldDef {
  key: string;
  label: string;
  type:
    | "text" | "url" | "textarea" | "select" | "image" | "emoji" | "platform" | "jdatetime"
    // added for mini-site blocks
    | "number" | "color" | "lucide" | "repeat" | "toggle";
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  /** preset choices for the emoji picker */
  presets?: string[];
  /** `repeat` only — the sub-fields of each row, and the row cap */
  itemFields?: FieldDef[];
  max?: number;
  /** `repeat` only — singular noun used in the "add" button ("افزودن دسته‌بندی") */
  itemLabel?: string;
  /** show this field only when another field has one of these values */
  showIf?: { key: string; equals: string[] };
}

// چند ایموجی پیشنهادی برای لینک‌ها
export const LINK_EMOJI_PRESETS = ["🌐", "🔗", "📱", "🛒", "📸", "▶️", "📍", "⭐", "💬", "📞"];

export const BLOCK_TYPES: BlockDef[] = [
  {
    type: "LINK",
    label: "لینک",
    icon: "🔗",
    description: "لینک ساده با عنوان",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    fields: [
      { key: "label", label: "عنوان", type: "text", placeholder: "مثلاً: سایت من", required: true },
      {
        key: "url", label: "آدرس لینک", type: "url", placeholder: "https://example.com", required: true,
        hint: "آدرس کامل مقصد را وارد کنید؛ مثال: https://instagram.com/yourpage یا https://mysite.ir",
      },
      { key: "icon", label: "آیکون (ایموجی)", type: "emoji", presets: LINK_EMOJI_PRESETS },
    ],
  },
  {
    type: "FEATURED",
    label: "لینک برجسته",
    icon: "⭐",
    description: "لینک با استایل ویژه",
    color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    fields: [
      { key: "label", label: "عنوان", type: "text", required: true },
      {
        key: "url", label: "آدرس", type: "url", placeholder: "https://example.com", required: true,
        hint: "آدرس کامل مقصد را وارد کنید؛ مثال: https://mysite.ir/product",
      },
      { key: "icon", label: "آیکون", type: "emoji", presets: LINK_EMOJI_PRESETS },
    ],
  },
  {
    type: "MESSENGER",
    label: "پیام‌رسان",
    icon: "💬",
    description: "واتساپ، تلگرام، بله، ایتا، روبیکا",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    fields: [
      {
        key: "data.platform",
        label: "پلتفرم",
        type: "platform",
        required: true,
        options: [
          { value: "telegram", label: "تلگرام" },
          { value: "whatsapp", label: "واتساپ" },
          { value: "bale", label: "بله" },
          { value: "rubika", label: "روبیکا" },
          { value: "eitaa", label: "ایتا" },
        ],
      },
      { key: "url", label: "شماره / یوزرنیم / لینک", type: "text", required: true, hint: "یوزرنیم بدون @ یا شماره یا لینک کامل" },
      { key: "label", label: "عنوان", type: "text", placeholder: "پیام بده!" },
    ],
  },
  {
    type: "PHONE",
    label: "تلفن",
    icon: "📞",
    description: "شماره تلفن (کلیک برای تماس)",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    fields: [
      { key: "url", label: "شماره تلفن", type: "text", placeholder: "09123456789", required: true },
      { key: "label", label: "عنوان", type: "text", placeholder: "تماس با ما" },
    ],
  },
  {
    type: "IMAGE",
    label: "تصویر",
    icon: "🖼️",
    description: "تصویر با لینک اختیاری",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    fields: [
      { key: "data.imageUrl", label: "تصویر", type: "image", required: true },
      { key: "label", label: "متن جایگزین", type: "text" },
      { key: "url", label: "لینک (اختیاری)", type: "url" },
    ],
  },
  {
    type: "TEXT",
    label: "متن",
    icon: "📝",
    description: "پاراگراف متن توضیحی",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    fields: [
      { key: "data.content", label: "متن", type: "textarea", required: true },
    ],
  },
  {
    type: "VIDEO",
    label: "ویدیو",
    icon: "🎬",
    description: "یوتیوب، آپارات، ویمئو",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    fields: [
      {
        key: "data.platform",
        label: "پلتفرم",
        type: "platform",
        required: true,
        options: [
          { value: "instagram", label: "اینستاگرام" },
          { value: "youtube", label: "یوتیوب" },
          { value: "aparat", label: "آپارات" },
        ],
      },
      { key: "url", label: "آدرس ویدیو", type: "url", required: true, hint: "لینک کامل ویدیو در یوتیوب/آپارات/اینستاگرام" },
      { key: "label", label: "عنوان", type: "text" },
    ],
  },
  {
    type: "MAP",
    label: "موقعیت مکانی",
    icon: "📍",
    description: "گوگل‌مپ، ویز، نقشه‌نشان",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    fields: [
      { key: "label", label: "نام مکان", type: "text", required: true },
      { key: "url", label: "لینک نقشه", type: "url", required: true },
    ],
  },
  {
    type: "EMAIL_CAPTURE",
    label: "جمع‌آوری ایمیل",
    icon: "📧",
    description: "فرم ساده ثبت ایمیل",
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    fields: [
      { key: "label", label: "عنوان فرم", type: "text", placeholder: "عضویت در خبرنامه" },
      { key: "data.placeholder", label: "متن placeholder", type: "text" },
    ],
  },
  {
    type: "FAQ",
    label: "سوال و جواب",
    icon: "❓",
    description: "آکاردیون سوالات متداول",
    color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    fields: [
      { key: "label", label: "سوال", type: "text", required: true },
      { key: "data.answer", label: "جواب", type: "textarea", required: true },
    ],
  },
  {
    type: "DIVIDER",
    label: "جداکننده",
    icon: "➖",
    description: "خط جداکننده بین بلوک‌ها",
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    fields: [
      { key: "label", label: "عنوان (اختیاری)", type: "text" },
      {
        key: "data.style", label: "مدل خط", type: "select",
        options: [
          { value: "solid", label: "خط ساده" },
          { value: "dashed", label: "خط‌چین" },
          { value: "dotted", label: "نقطه‌چین" },
          { value: "gradient", label: "محو‌شونده" },
          { value: "double", label: "دو‌خطی" },
        ],
      },
    ],
  },
  {
    type: "GROUP",
    label: "گروه",
    icon: "📁",
    description: "گروه‌بندی لینک‌ها با تیتر",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    fields: [
      { key: "label", label: "عنوان گروه", type: "text", required: true },
    ],
  },
  {
    type: "ORDER_FORM",
    label: "فرم سفارش",
    icon: "🛒",
    description: "دکمه‌ای که کاربر را به لینک سفارش می‌برد",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    fields: [
      { key: "label", label: "عنوان دکمه", type: "text", placeholder: "ثبت سفارش آنلاین", required: true },
      {
        key: "url", label: "لینک مقصد", type: "url", required: true,
        hint: "با کلیک روی دکمه، کاربر به این آدرس می‌رود؛ مثال: https://wa.me/98912...",
      },
    ],
  },
  {
    type: "WHATSAPP",
    label: "واتساپ هوشمند",
    icon: "💚",
    description: "دکمه واتساپ با پیام آماده",
    color: "bg-green-500/10 text-green-400 border-green-500/20",
    fields: [
      { key: "label", label: "عنوان دکمه", type: "text", placeholder: "پیام در واتساپ" },
      { key: "data.phone", label: "شماره واتساپ (با کد کشور)", type: "text", placeholder: "989123456789", required: true },
      { key: "data.message", label: "پیام پیش‌فرض", type: "textarea", placeholder: "سلام، می‌خوام سفارش بدم" },
    ],
  },
  {
    type: "FLASH_SALE",
    label: "فروش ویژه (Flash Sale)",
    icon: "⚡",
    description: "تایمر شمارش معکوس برای فروش ویژه",
    color: "bg-red-500/10 text-red-400 border-red-500/20",
    fields: [
      { key: "label", label: "عنوان فروش ویژه", type: "text", placeholder: "حراج ویژه", required: true },
      { key: "data.discount", label: "درصد تخفیف", type: "text", placeholder: "۳۰" },
      { key: "data.endDate", label: "تاریخ و ساعت پایان", type: "jdatetime" },
      { key: "data.description", label: "توضیح کوتاه", type: "text", placeholder: "فقط تا آخر هفته!" },
    ],
  },

  // ─── بلوک‌های مینی‌سایت ────────────────────────────────────────────────────

  {
    type: "HERO",
    label: "هدر صفحه",
    icon: "🖼️",
    description: "تصویر بزرگ + عنوان + زیرعنوان + دکمه",
    color: "bg-accent-500/10 text-accent-500 border-accent-500/20",
    defaults: { height: "md", overlay: "60", align: "center" },
    fields: [
      { key: "label", label: "عنوان اصلی", type: "text", placeholder: "فروشگاه من", required: true },
      { key: "data.subtitle", label: "زیرعنوان", type: "text", placeholder: "توضیح کوتاه کسب‌وکار" },
      { key: "data.imageUrl", label: "تصویر پس‌زمینه", type: "image", hint: "اگر خالی بماند، گرادیان رنگ اصلی استفاده می‌شود" },
      {
        key: "data.height", label: "ارتفاع", type: "select",
        options: [{ value: "sm", label: "کوتاه" }, { value: "md", label: "متوسط" }, { value: "lg", label: "بلند" }],
      },
      {
        key: "data.overlay", label: "تیرگی روی تصویر", type: "select",
        hint: "برای خوانا ماندن متن روی عکس‌های روشن، مقدار بیشتری انتخاب کن",
        options: [
          { value: "0", label: "بدون تیرگی" }, { value: "30", label: "کم" },
          { value: "60", label: "متوسط" }, { value: "80", label: "زیاد" },
        ],
      },
      { key: "data.ctaLabel", label: "متن دکمه", type: "text", placeholder: "مشاهده محصولات" },
      { key: "url", label: "لینک دکمه", type: "url", showIf: { key: "data.ctaLabel", equals: ["*"] } },
    ],
  },
  {
    type: "TRUST_BAR",
    label: "نوار اعتماد",
    icon: "🛡️",
    description: "ارسال سریع، ضمانت اصالت، پرداخت امن…",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    defaults: {
      items: [
        { icon: "truck", title: "ارسال سریع", subtitle: "۱ تا ۲ روز کاری" },
        { icon: "shield-check", title: "ضمانت اصالت", subtitle: "کالای اورجینال" },
        { icon: "credit-card", title: "پرداخت امن", subtitle: "درگاه معتبر" },
      ],
    },
    fields: [
      {
        key: "data.items", label: "آیتم‌ها", type: "repeat", max: 4, itemLabel: "آیتم",
        itemFields: [
          { key: "icon", label: "آیکون", type: "lucide" },
          { key: "title", label: "عنوان", type: "text", placeholder: "ارسال سریع" },
          { key: "subtitle", label: "زیرنویس", type: "text", placeholder: "۱ تا ۲ روز کاری" },
        ],
      },
    ],
  },
  {
    type: "CATEGORY_CHIPS",
    label: "دسته‌بندی",
    icon: "🗂️",
    description: "ردیف دسته‌بندی با آیکون یا تصویر",
    color: "bg-sky-500/10 text-sky-500 border-sky-500/20",
    defaults: { shape: "circle", items: [] },
    fields: [
      { key: "label", label: "عنوان بخش (اختیاری)", type: "text", placeholder: "دسته‌بندی‌ها" },
      {
        key: "data.shape", label: "شکل", type: "select",
        options: [
          { value: "circle", label: "دایره" }, { value: "rounded", label: "مربع گرد" },
          { value: "pill", label: "قرصی (فقط متن)" },
        ],
      },
      {
        key: "data.items", label: "دسته‌بندی‌ها", type: "repeat", max: 12, itemLabel: "دسته‌بندی",
        itemFields: [
          { key: "title", label: "نام", type: "text", required: true },
          { key: "icon", label: "آیکون", type: "lucide" },
          { key: "imageUrl", label: "تصویر (جای آیکون)", type: "image" },
          { key: "url", label: "لینک", type: "url" },
        ],
      },
    ],
  },
  {
    type: "PRODUCT_GRID",
    label: "گرید محصولات",
    icon: "🛍️",
    description: "محصولات واقعی فروشگاه یا آیتم‌های دستی",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    defaults: { source: "auto", limit: 6, columns: "2", items: [] },
    fields: [
      { key: "label", label: "عنوان بخش", type: "text", placeholder: "محصولات ویژه" },
      {
        key: "data.source", label: "منبع", type: "select",
        hint: "«خودکار» محصولات واقعی فروشگاه را نشان می‌دهد و با هر تغییر انبار به‌روز می‌شود",
        options: [
          { value: "auto", label: "خودکار — محصولات فروشگاه" },
          { value: "manual", label: "دستی — آیتم‌های زیر" },
        ],
      },
      {
        key: "data.columns", label: "تعداد ستون", type: "select",
        options: [{ value: "2", label: "۲ ستون" }, { value: "3", label: "۳ ستون" }],
      },
      {
        key: "data.limit", label: "حداکثر تعداد", type: "number",
        showIf: { key: "data.source", equals: ["auto"] },
      },
      {
        key: "data.items", label: "محصولات دستی", type: "repeat", max: 12, itemLabel: "محصول",
        showIf: { key: "data.source", equals: ["manual"] },
        itemFields: [
          { key: "title", label: "نام محصول", type: "text", required: true },
          { key: "imageUrl", label: "تصویر", type: "image" },
          { key: "price", label: "قیمت (تومان)", type: "number" },
          { key: "oldPrice", label: "قیمت قبل از تخفیف", type: "number" },
          { key: "badge", label: "برچسب", type: "text", placeholder: "جدید / ۲۰٪ تخفیف" },
          { key: "url", label: "لینک", type: "url" },
        ],
      },
      { key: "data.moreLabel", label: "متن لینک «مشاهده همه»", type: "text", placeholder: "مشاهده همه" },
      { key: "url", label: "لینک «مشاهده همه»", type: "url" },
    ],
  },
  {
    type: "GALLERY",
    label: "گالری تصاویر",
    icon: "📸",
    description: "گرید عکس — نمونه‌کار، منو، محیط",
    color: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    defaults: { columns: "3", ratio: "square", items: [] },
    fields: [
      { key: "label", label: "عنوان بخش", type: "text", placeholder: "نمونه کارها" },
      {
        key: "data.columns", label: "تعداد ستون", type: "select",
        options: [{ value: "2", label: "۲ ستون" }, { value: "3", label: "۳ ستون" }],
      },
      {
        key: "data.ratio", label: "نسبت تصویر", type: "select",
        options: [
          { value: "square", label: "مربع" }, { value: "portrait", label: "عمودی" },
          { value: "landscape", label: "افقی" },
        ],
      },
      {
        key: "data.items", label: "تصاویر", type: "repeat", max: 12, itemLabel: "تصویر",
        itemFields: [
          { key: "imageUrl", label: "تصویر", type: "image", required: true },
          { key: "title", label: "توضیح (متن جایگزین)", type: "text" },
          { key: "url", label: "لینک", type: "url" },
        ],
      },
    ],
  },
  {
    type: "TESTIMONIAL",
    label: "نظر مشتری",
    icon: "💬",
    description: "نظر مشتری با امتیاز ستاره",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    defaults: { items: [] },
    fields: [
      { key: "label", label: "عنوان بخش", type: "text", placeholder: "نظر مشتریان" },
      {
        key: "data.items", label: "نظرها", type: "repeat", max: 8, itemLabel: "نظر",
        itemFields: [
          { key: "text", label: "متن نظر", type: "textarea", required: true },
          { key: "name", label: "نام مشتری", type: "text" },
          { key: "role", label: "توضیح زیر نام", type: "text", placeholder: "مشتری وفادار" },
          { key: "avatarUrl", label: "عکس", type: "image" },
          {
            key: "rating", label: "امتیاز", type: "select",
            options: [
              { value: "5", label: "۵ ستاره" }, { value: "4", label: "۴ ستاره" },
              { value: "3", label: "۳ ستاره" }, { value: "0", label: "بدون ستاره" },
            ],
          },
        ],
      },
    ],
  },
  {
    type: "STATS",
    label: "آمار و اعداد",
    icon: "📊",
    description: "۲ تا ۴ عدد کلیدی با برچسب",
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    defaults: { items: [] },
    fields: [
      {
        key: "data.items", label: "اعداد", type: "repeat", max: 4, itemLabel: "عدد",
        hint: "فقط عددهای واقعی کسب‌وکارت را وارد کن — آمار ساختگی اعتماد را از بین می‌برد",
        itemFields: [
          { key: "value", label: "عدد", type: "text", placeholder: "+۵۰۰", required: true },
          { key: "title", label: "برچسب", type: "text", placeholder: "مشتری راضی" },
          { key: "icon", label: "آیکون (اختیاری)", type: "lucide" },
        ],
      },
    ],
  },
  {
    type: "SOCIAL_ROW",
    label: "شبکه‌های اجتماعی",
    icon: "🔗",
    description: "ردیف آیکون اینستاگرام، تلگرام، واتساپ…",
    color: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20",
    defaults: { style: "icon", items: [] },
    fields: [
      {
        key: "data.style", label: "نمایش", type: "select",
        options: [
          { value: "icon", label: "فقط آیکون" }, { value: "labeled", label: "آیکون + نام" },
        ],
      },
      {
        key: "data.items", label: "شبکه‌ها", type: "repeat", max: 8, itemLabel: "شبکه",
        itemFields: [
          {
            key: "platform", label: "پلتفرم", type: "platform", required: true,
            options: [
              { value: "instagram", label: "اینستاگرام" }, { value: "telegram", label: "تلگرام" },
              { value: "whatsapp", label: "واتساپ" }, { value: "youtube", label: "یوتیوب" },
              { value: "linkedin", label: "لینکدین" }, { value: "aparat", label: "آپارات" },
              { value: "bale", label: "بله" }, { value: "eitaa", label: "ایتا" },
              { value: "rubika", label: "روبیکا" },
            ],
          },
          { key: "url", label: "آدرس / یوزرنیم", type: "text", required: true },
        ],
      },
    ],
  },
  {
    type: "HOURS",
    label: "ساعت کاری و آدرس",
    icon: "🕐",
    description: "ساعت کاری، آدرس و اطلاعات تماس",
    color: "bg-teal-500/10 text-teal-500 border-teal-500/20",
    defaults: { items: [] },
    fields: [
      { key: "label", label: "عنوان بخش", type: "text", placeholder: "ساعت کاری" },
      { key: "data.address", label: "آدرس", type: "textarea", placeholder: "تهران، خیابان…" },
      { key: "url", label: "لینک نقشه", type: "url" },
      {
        key: "data.items", label: "ساعت‌ها", type: "repeat", max: 7, itemLabel: "ردیف",
        itemFields: [
          { key: "title", label: "روز", type: "text", placeholder: "شنبه تا پنجشنبه", required: true },
          { key: "value", label: "ساعت", type: "text", placeholder: "۹:۰۰ تا ۱۸:۰۰" },
        ],
      },
    ],
  },
  {
    type: "PRICE_LIST",
    label: "لیست خدمات و قیمت",
    icon: "🧾",
    description: "جدول خدمات با قیمت",
    color: "bg-lime-500/10 text-lime-600 border-lime-500/20",
    defaults: { items: [] },
    fields: [
      { key: "label", label: "عنوان بخش", type: "text", placeholder: "لیست خدمات و قیمت‌ها" },
      {
        key: "data.items", label: "ردیف‌ها", type: "repeat", max: 20, itemLabel: "خدمت",
        itemFields: [
          { key: "title", label: "خدمت", type: "text", required: true },
          { key: "subtitle", label: "توضیح کوتاه", type: "text" },
          { key: "value", label: "قیمت", type: "text", placeholder: "۱۵٬۰۰۰ تومان" },
        ],
      },
    ],
  },
  {
    type: "BUTTON_ROW",
    label: "ردیف دکمه",
    icon: "🔘",
    description: "دو دکمه کنار هم — اصلی و فرعی",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    fields: [
      { key: "label", label: "متن دکمه اصلی", type: "text", required: true, placeholder: "خرید سریع" },
      { key: "url", label: "لینک دکمه اصلی", type: "url", required: true },
      { key: "data.primaryIcon", label: "آیکون دکمه اصلی", type: "lucide" },
      { key: "data.secondaryLabel", label: "متن دکمه دوم", type: "text", placeholder: "تماس با ما" },
      { key: "data.secondaryUrl", label: "لینک دکمه دوم", type: "url" },
      { key: "data.secondaryIcon", label: "آیکون دکمه دوم", type: "lucide" },
    ],
  },
  {
    type: "BOTTOM_NAV",
    label: "نوار پایین صفحه",
    icon: "📱",
    description: "نوار ناوبری چسبان پایین (مثل اپلیکیشن)",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    defaults: { items: [] },
    fields: [
      {
        key: "data.items", label: "آیتم‌ها", type: "repeat", max: 5, itemLabel: "آیتم",
        hint: "حداکثر ۵ آیتم — بیشتر از این روی موبایل خوانا نیست",
        itemFields: [
          { key: "title", label: "برچسب", type: "text", required: true },
          { key: "icon", label: "آیکون", type: "lucide" },
          { key: "url", label: "لینک", type: "url" },
        ],
      },
    ],
  },
];

/**
 * Which drawer of the picker each block lives in. Kept as a map rather than a
 * field on BlockDef so adding a category never means touching 27 definitions.
 */
export const BLOCK_CATEGORY_OF: Record<BlockType, BlockCategory> = {
  HERO: "site", TRUST_BAR: "site", CATEGORY_CHIPS: "site", SOCIAL_ROW: "site",
  BUTTON_ROW: "site", BOTTOM_NAV: "site", DIVIDER: "site", GROUP: "site",
  LINK: "link", FEATURED: "link", MESSENGER: "link", PHONE: "link",
  WHATSAPP: "link", MAP: "link", EMAIL_BLOCK: "link", REDIRECT: "link",
  PRODUCT_GRID: "sell", PRICE_LIST: "sell", ORDER_FORM: "sell",
  FLASH_SALE: "sell", STATS: "sell", TESTIMONIAL: "sell", EMAIL_CAPTURE: "sell",
  IMAGE: "content", TEXT: "content", VIDEO: "content", GALLERY: "content",
  FAQ: "content", HOURS: "content", MUSIC: "content", PODCAST: "content",
};

export function getBlockDef(type: BlockType): BlockDef {
  return BLOCK_TYPES.find((b) => b.type === type) || BLOCK_TYPES[0];
}

export const MESSENGER_META: Record<string, { label: string; color: string; prefix: string }> = {
  whatsapp: { label: "واتساپ", color: "#25D366", prefix: "https://wa.me/" },
  telegram: { label: "تلگرام", color: "#2AABEE", prefix: "https://t.me/" },
  bale: { label: "بله", color: "#2e2e74", prefix: "https://bale.ai/" },
  eitaa: { label: "ایتا", color: "#EE7F22", prefix: "https://eitaa.com/" },
  rubika: { label: "روبیکا", color: "#6C2BD9", prefix: "https://rubika.ir/" },
  gap: { label: "گپ", color: "#0088cc", prefix: "https://gap.im/" },
  soroush: { label: "سروش", color: "#1a73e8", prefix: "https://splus.ir/" },
};
