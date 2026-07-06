export type BlockType =
  | "LINK" | "GROUP" | "IMAGE" | "TEXT" | "VIDEO"
  | "PHONE" | "EMAIL_BLOCK" | "MESSENGER" | "MAP"
  | "MUSIC" | "PODCAST" | "FAQ" | "REDIRECT" | "FEATURED"
  | "EMAIL_CAPTURE" | "DIVIDER"
  | "ORDER_FORM" | "FLASH_SALE" | "WHATSAPP";

export interface BlockDef {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  color: string;
  fields: FieldDef[];
}

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "url" | "textarea" | "select" | "image" | "emoji" | "platform" | "jdatetime";
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  /** preset choices for the emoji picker */
  presets?: string[];
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
];

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
