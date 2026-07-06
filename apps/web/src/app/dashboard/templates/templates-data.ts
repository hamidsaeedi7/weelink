// قالب‌های آمادهٔ صفحه بیو — هر قالب مجموعه‌ای از بلوک‌های پیش‌فرض دارد.
// بلوک‌ها با CreateBlockDto سازگارند: { type, label?, url?, icon?, data? }

export interface TplBlock {
  type: string;
  label?: string;
  url?: string;
  icon?: string;
  data?: Record<string, any>;
}
export interface Template {
  id: string;
  label: string;
  emoji: string;
  color: string;        // gradient classes
  accentColor: string;
  desc: string;
  blocks: TplBlock[];
}

// ─── block builders (کوتاه‌نویسی) ─────────────────────────────────────────────
const txt = (content: string): TplBlock => ({ type: "TEXT", data: { content } });
const feat = (label: string, icon = "⭐"): TplBlock => ({ type: "FEATURED", label, url: "#", icon });
const link = (label: string, icon = "🔗"): TplBlock => ({ type: "LINK", label, url: "#", icon });
const tel = (label = "تماس تلفنی"): TplBlock => ({ type: "PHONE", label, url: "02100000000" });
const wa = (label: string, message: string): TplBlock =>
  ({ type: "WHATSAPP", label, data: { phone: "989120000000", message } });
const tg = (label = "کانال تلگرام"): TplBlock =>
  ({ type: "MESSENGER", label, url: "yourchannel", data: { platform: "telegram" } });
const insta = (label = "پیج اینستاگرام"): TplBlock => ({ type: "LINK", label, url: "https://instagram.com/", icon: "📸" });
const map = (label = "آدرس روی نقشه"): TplBlock => ({ type: "MAP", label, url: "https://maps.google.com" });
const faq = (label: string, answer: string): TplBlock => ({ type: "FAQ", label, data: { answer } });
const order = (label = "ثبت سفارش آنلاین"): TplBlock => ({ type: "ORDER_FORM", label, url: "https://wa.me/989120000000" });

export const TEMPLATES: Template[] = [
  // ── خدمات و پزشکی ──
  {
    id: "doctor", label: "دکتر، پزشک و دندان‌پزشک", emoji: "🩺",
    color: "from-blue-500/20 to-cyan-500/20", accentColor: "#3B82F6",
    desc: "نوبت‌دهی، مشاوره، آدرس مطب و داروخانه",
    blocks: [
      txt("مطب تخصصی — ویزیت حضوری و مشاورهٔ آنلاین"),
      feat("نوبت‌دهی آنلاین", "📅"),
      wa("رزرو نوبت واتساپ", "سلام، می‌خوام نوبت بگیرم"),
      tel("تماس با منشی"),
      map("آدرس مطب"),
      faq("ساعات کاری", "شنبه تا چهارشنبه ۹ تا ۱۸، پنجشنبه ۹ تا ۱۳"),
    ],
  },
  {
    id: "beauty_clinic", label: "کلینیک زیبایی", emoji: "💆‍♀️",
    color: "from-pink-500/20 to-rose-500/20", accentColor: "#EC4899",
    desc: "خدمات پوست، مو، لیزر و رزرو نوبت",
    blocks: [
      txt("کلینیک تخصصی پوست، مو و زیبایی"),
      feat("رزرو وقت مشاوره", "✨"),
      link("لیست خدمات و تعرفه", "💅"),
      wa("مشاورهٔ رایگان", "سلام، برای مشاوره پیام دادم"),
      insta("نمونه کارها در اینستاگرام"),
      map("آدرس کلینیک"),
    ],
  },
  {
    id: "medical_supply", label: "لوازم سلامت و پزشکی", emoji: "🩹",
    color: "from-teal-500/20 to-emerald-500/20", accentColor: "#14B8A6",
    desc: "تجهیزات پزشکی، ارتوپدی و مراقبت",
    blocks: [
      txt("فروش تجهیزات پزشکی و لوازم مراقبت در منزل"),
      feat("مشاهده محصولات", "🩺"),
      order("ثبت سفارش"),
      wa("استعلام قیمت", "سلام، قیمت این محصول چنده؟"),
      tel(),
    ],
  },
  {
    id: "pharmacy", label: "داروخانه", emoji: "💊",
    color: "from-green-500/20 to-emerald-500/20", accentColor: "#22C55E",
    desc: "سفارش دارو، مکمل و لوازم بهداشتی",
    blocks: [
      txt("داروخانه — ارسال دارو و مکمل به سراسر شهر"),
      feat("سفارش دارو با نسخه", "💊"),
      wa("ارسال نسخه", "سلام، نسخه‌ام رو می‌فرستم"),
      tel("تماس با داروخانه"),
      faq("ساعات کاری", "همه‌روزه ۸ صبح تا ۱۲ شب"),
    ],
  },

  // ── ورزش ──
  {
    id: "coach", label: "مربی ورزشی و باشگاه", emoji: "💪",
    color: "from-orange-500/20 to-red-500/20", accentColor: "#F97316",
    desc: "برنامه تمرین، ثبت‌نام کلاس و مشاوره",
    blocks: [
      txt("مربی تخصصی فیتنس و تناسب اندام"),
      feat("ثبت‌نام دورهٔ آنلاین", "⚡"),
      link("برنامهٔ تمرین و تغذیه", "📋"),
      wa("مشاورهٔ رایگان", "سلام، می‌خوام برنامه بگیرم"),
      tg("کانال تمرین‌ها"),
      insta(),
    ],
  },
  {
    id: "sports_travel", label: "لوازم ورزشی و سفر", emoji: "🏕️",
    color: "from-lime-500/20 to-green-500/20", accentColor: "#84CC16",
    desc: "تجهیزات ورزشی، کوهنوردی و کمپینگ",
    blocks: [
      txt("فروش لوازم ورزشی، کوهنوردی و سفر"),
      feat("جدیدترین محصولات", "🎒"),
      order("ثبت سفارش"),
      wa("مشاوره خرید", "سلام، برای خرید نیاز به مشاوره دارم"),
      insta(),
    ],
  },

  // ── فروشگاه‌ها ──
  {
    id: "shop_insta", label: "فروشگاه اینستاگرام", emoji: "🛍️",
    color: "from-pink-500/20 to-purple-500/20", accentColor: "#D946EF",
    desc: "محصولات، سفارش واتساپ و تخفیف‌ها",
    blocks: [
      txt("فروش آنلاین محصولات اورجینال با ارسال به سراسر کشور"),
      feat("مشاهده محصولات", "🛍️"),
      order("ثبت سفارش آنلاین"),
      { type: "FLASH_SALE", label: "حراج ویژه", data: { discount: "۳۰", description: "فقط تا آخر هفته!", endDate: "" } },
      wa("سفارش واتساپ", "سلام، می‌خوام سفارش بدم"),
      tg("کانال تخفیف‌ها"),
    ],
  },
  {
    id: "telegram_shop", label: "فروشگاه کانال تلگرامی", emoji: "📢",
    color: "from-sky-500/20 to-blue-500/20", accentColor: "#0EA5E9",
    desc: "معرفی کانال، سفارش و پشتیبانی",
    blocks: [
      txt("فروشگاه ما در تلگرام — جدیدترین محصولات و تخفیف‌ها"),
      tg("عضویت در کانال اصلی"),
      feat("مشاهده محصولات", "🛒"),
      order("ثبت سفارش"),
      wa("پشتیبانی و سفارش", "سلام، از کانال تلگرام اومدم"),
    ],
  },
  {
    id: "supermarket", label: "سوپرمارکت و فروشگاه زنجیره‌ای", emoji: "🛒",
    color: "from-amber-500/20 to-yellow-500/20", accentColor: "#F59E0B",
    desc: "سفارش آنلاین و ارسال سریع مایحتاج",
    blocks: [
      txt("سوپرمارکت آنلاین — ارسال سریع به درب منزل"),
      feat("سفارش آنلاین", "🛒"),
      order("ثبت سفارش"),
      wa("سفارش تلفنی", "سلام، می‌خوام سفارش بدم"),
      tel(),
      map("آدرس فروشگاه"),
    ],
  },
  {
    id: "home_appliance", label: "لوازم خانگی", emoji: "🧺",
    color: "from-indigo-500/20 to-blue-500/20", accentColor: "#6366F1",
    desc: "فروش اقساطی و نقدی لوازم خانگی",
    blocks: [
      txt("فروش انواع لوازم خانگی — نقد و اقساط"),
      feat("محصولات پرفروش", "🧊"),
      link("خرید اقساطی", "💳"),
      order("ثبت سفارش"),
      wa("استعلام قیمت", "سلام، قیمت این محصول رو می‌خوام"),
      map("آدرس فروشگاه"),
    ],
  },
  {
    id: "cosmetics", label: "آرایشی و بهداشتی", emoji: "💄",
    color: "from-rose-500/20 to-pink-500/20", accentColor: "#F43F5E",
    desc: "محصولات اورجینال آرایشی و مراقبت",
    blocks: [
      txt("فروش محصولات آرایشی و بهداشتی اورجینال"),
      feat("جدیدترین محصولات", "💄"),
      order("ثبت سفارش"),
      { type: "FLASH_SALE", label: "تخفیف ویژه", data: { discount: "۲۵", description: "محدود!", endDate: "" } },
      wa("مشاوره خرید", "سلام، برای انتخاب محصول کمک می‌خوام"),
      insta(),
    ],
  },
  {
    id: "fashion", label: "مد و پوشاک", emoji: "👗",
    color: "from-fuchsia-500/20 to-purple-500/20", accentColor: "#C026D3",
    desc: "پوشاک زنانه، مردانه و بچگانه",
    blocks: [
      txt("بوتیک آنلاین — جدیدترین مدل‌های پوشاک"),
      feat("کالکشن جدید", "👗"),
      order("ثبت سفارش"),
      wa("سفارش و سایزبندی", "سلام، برای سفارش راهنمایی می‌خوام"),
      insta("گالری محصولات"),
    ],
  },
  {
    id: "jewelry", label: "طلا، نقره و بدلیجات", emoji: "💍",
    color: "from-yellow-500/20 to-amber-500/20", accentColor: "#EAB308",
    desc: "زیورآلات طلا، نقره و اکسسوری",
    blocks: [
      txt("گالری طلا و جواهر — طراحی و فروش زیورآلات"),
      feat("جدیدترین طرح‌ها", "💍"),
      link("قیمت لحظه‌ای طلا", "📈"),
      wa("سفارش و مشاوره", "سلام، برای خرید مشاوره می‌خوام"),
      insta(),
      map("آدرس گالری"),
    ],
  },
  {
    id: "petshop", label: "پت‌شاپ", emoji: "🐾",
    color: "from-emerald-500/20 to-teal-500/20", accentColor: "#10B981",
    desc: "غذا، لوازم و خدمات حیوانات خانگی",
    blocks: [
      txt("پت‌شاپ — غذا و لوازم حیوانات خانگی با ارسال سریع"),
      feat("محصولات پرفروش", "🐕"),
      order("ثبت سفارش"),
      wa("مشاوره و سفارش", "سلام، برای پتم نیاز به راهنمایی دارم"),
      insta(),
    ],
  },
  {
    id: "baby_toys", label: "اسباب‌بازی کودک و نوزاد", emoji: "🧸",
    color: "from-orange-400/20 to-pink-400/20", accentColor: "#FB923C",
    desc: "اسباب‌بازی و لوازم کودک و نوزاد",
    blocks: [
      txt("فروشگاه اسباب‌بازی و لوازم کودک و نوزاد"),
      feat("محصولات جدید", "🧸"),
      order("ثبت سفارش"),
      wa("سفارش واتساپ", "سلام، می‌خوام سفارش بدم"),
      insta(),
    ],
  },
  {
    id: "local_products", label: "محصولات بومی و محلی", emoji: "🌾",
    color: "from-green-600/20 to-lime-500/20", accentColor: "#65A30D",
    desc: "سوغات، صنایع‌دستی و محصولات ارگانیک",
    blocks: [
      txt("فروش محصولات بومی، سوغات و صنایع‌دستی اصیل"),
      feat("محصولات ویژه", "🌾"),
      order("ثبت سفارش"),
      wa("سفارش و ارسال", "سلام، می‌خوام سفارش بدم"),
      tg("کانال محصولات"),
    ],
  },

  // ── دیجیتال و تعمیرات ──
  {
    id: "mobile_shop", label: "فروش موبایل و قطعات", emoji: "📱",
    color: "from-slate-500/20 to-gray-500/20", accentColor: "#64748B",
    desc: "گوشی، قطعات و لوازم جانبی موبایل",
    blocks: [
      txt("فروش موبایل، قطعات و لوازم جانبی — گارانتی معتبر"),
      feat("گوشی‌های موجود", "📱"),
      link("لیست قیمت روز", "💰"),
      order("ثبت سفارش"),
      wa("استعلام قیمت", "سلام، قیمت این گوشی چنده؟"),
      map("آدرس فروشگاه"),
    ],
  },
  {
    id: "laptop_shop", label: "لپ‌تاپ، کامپیوتر و لوازم جانبی", emoji: "💻",
    color: "from-blue-600/20 to-indigo-500/20", accentColor: "#2563EB",
    desc: "فروش سیستم، لپ‌تاپ و قطعات کامپیوتر",
    blocks: [
      txt("فروش لپ‌تاپ، کامپیوتر و قطعات — مشاورهٔ تخصصی"),
      feat("سیستم‌های آماده", "💻"),
      link("اسمبل سیستم دلخواه", "🛠️"),
      order("ثبت سفارش"),
      wa("مشاورهٔ خرید", "سلام، برای خرید سیستم راهنمایی می‌خوام"),
    ],
  },
  {
    id: "device_repair", label: "تعمیر موبایل و کامپیوتر", emoji: "🔧",
    color: "from-cyan-500/20 to-blue-500/20", accentColor: "#06B6D4",
    desc: "تعمیر تخصصی موبایل، لپ‌تاپ و تبلت",
    blocks: [
      txt("تعمیر تخصصی موبایل، لپ‌تاپ و تبلت — تضمین کیفیت"),
      feat("ثبت درخواست تعمیر", "🔧"),
      wa("پشتیبانی و تعمیر", "سلام، دستگاهم مشکل داره"),
      tel(),
      faq("گارانتی تعمیر", "تمام تعمیرات دارای ۳ ماه گارانتی هستند"),
      map("آدرس تعمیرگاه"),
    ],
  },
  {
    id: "print_shop", label: "خدمات چاپ و کافی‌نت", emoji: "🖨️",
    color: "from-violet-500/20 to-purple-500/20", accentColor: "#8B5CF6",
    desc: "چاپ، تایپ، اسکن و خدمات اداری",
    blocks: [
      txt("خدمات چاپ، تایپ، اسکن و امور اداری و دانشجویی"),
      feat("ثبت سفارش چاپ", "🖨️"),
      wa("ارسال فایل چاپ", "سلام، فایلم رو برای چاپ می‌فرستم"),
      tel(),
      map("آدرس"),
    ],
  },

  // ── خودرو ──
  {
    id: "car_showroom", label: "نمایشگاه ماشین و موتور", emoji: "🚗",
    color: "from-red-500/20 to-orange-500/20", accentColor: "#EF4444",
    desc: "خرید، فروش و معاوضهٔ خودرو",
    blocks: [
      txt("نمایشگاه اتومبیل — خرید، فروش و معاوضه با بهترین قیمت"),
      feat("خودروهای موجود", "🚗"),
      link("کارشناسی و قیمت‌گذاری", "🔍"),
      wa("مشاورهٔ خرید و فروش", "سلام، برای خرید/فروش خودرو تماس گرفتم"),
      tel(),
      map("آدرس نمایشگاه"),
    ],
  },
  {
    id: "car_repair", label: "تعمیرگاه ماشین و موتور", emoji: "🔩",
    color: "from-zinc-500/20 to-slate-500/20", accentColor: "#71717A",
    desc: "تعمیر، سرویس و نوبت‌دهی خودرو",
    blocks: [
      txt("تعمیرگاه تخصصی خودرو و موتورسیکلت — سرویس دوره‌ای"),
      feat("رزرو نوبت تعمیر", "🔧"),
      wa("مشاوره فنی", "سلام، ماشینم این مشکل رو داره"),
      tel(),
      faq("خدمات", "تعمیرات موتور، گیربکس، برق و سرویس دوره‌ای"),
      map("آدرس تعمیرگاه"),
    ],
  },
  {
    id: "auto_parts", label: "لوازم یدکی", emoji: "⚙️",
    color: "from-stone-500/20 to-neutral-500/20", accentColor: "#78716C",
    desc: "قطعات و لوازم یدکی خودرو و موتور",
    blocks: [
      txt("فروش لوازم یدکی اصلی و های‌کپی — ارسال به سراسر کشور"),
      feat("قطعات موجود", "⚙️"),
      order("ثبت سفارش"),
      wa("استعلام قطعه", "سلام، این قطعه رو دارید؟"),
      tel(),
    ],
  },
  {
    id: "tools", label: "ابزارآلات و تجهیزات", emoji: "🛠️",
    color: "from-amber-600/20 to-yellow-600/20", accentColor: "#D97706",
    desc: "ابزار برقی، دستی و صنعتی",
    blocks: [
      txt("فروش ابزارآلات برقی، دستی و تجهیزات صنعتی"),
      feat("محصولات پرفروش", "🛠️"),
      order("ثبت سفارش"),
      wa("مشاوره و استعلام", "سلام، قیمت این ابزار رو می‌خوام"),
      map("آدرس فروشگاه"),
    ],
  },

  // ── خدمات حرفه‌ای ──
  {
    id: "freelancer", label: "فریلنسر", emoji: "🧑‍💻",
    color: "from-purple-500/20 to-indigo-500/20", accentColor: "#8B5CF6",
    desc: "نمونه‌کار، رزومه و سفارش پروژه",
    blocks: [
      txt("فریلنسر — طراحی، توسعه و خدمات دیجیتال"),
      feat("مشاهده نمونه‌کارها", "💼"),
      link("دانلود رزومه", "📄"),
      wa("سفارش پروژه", "سلام، یه پروژه دارم می‌خوام صحبت کنیم"),
      link("پروفایل لینکدین", "🔗"),
      tg("کانال کارها"),
    ],
  },
  {
    id: "digital_marketing", label: "آژانس دیجیتال مارکتینگ", emoji: "📈",
    color: "from-blue-500/20 to-cyan-400/20", accentColor: "#0EA5E9",
    desc: "خدمات تبلیغات، سئو و شبکه‌های اجتماعی",
    blocks: [
      txt("آژانس دیجیتال مارکتینگ — رشد کسب‌وکار شما آنلاین"),
      feat("مشاورهٔ رایگان", "🚀"),
      link("نمونه پروژه‌ها", "📊"),
      link("پکیج‌ها و تعرفه", "💰"),
      wa("درخواست مشاوره", "سلام، برای تبلیغات کسب‌وکارم مشاوره می‌خوام"),
      insta(),
    ],
  },
  {
    id: "teacher", label: "مدرس و دوره‌های آموزشی", emoji: "👨‍🏫",
    color: "from-green-500/20 to-teal-500/20", accentColor: "#059669",
    desc: "ثبت‌نام دوره، نمونه تدریس و مشاوره",
    blocks: [
      txt("مدرس و برگزارکنندهٔ دوره‌های آموزشی تخصصی"),
      feat("ثبت‌نام دورهٔ جدید", "🎓"),
      { type: "VIDEO", label: "نمونهٔ تدریس", url: "https://youtube.com/", data: { platform: "youtube" } },
      link("سرفصل دوره‌ها", "📚"),
      wa("مشاورهٔ ثبت‌نام", "سلام، برای ثبت‌نام دوره سوال دارم"),
      tg("کانال آموزشی"),
    ],
  },
  {
    id: "publisher", label: "انتشارات کتاب", emoji: "📖",
    color: "from-amber-500/20 to-orange-500/20", accentColor: "#F59E0B",
    desc: "فروش کتاب، چاپ اثر و معرفی نویسنده",
    blocks: [
      txt("انتشارات — فروش کتاب و چاپ آثار نویسندگان"),
      feat("تازه‌های نشر", "📚"),
      order("سفارش کتاب"),
      link("چاپ کتاب شما", "✍️"),
      wa("مشاوره چاپ", "سلام، می‌خوام کتابم رو چاپ کنم"),
      insta(),
    ],
  },
  {
    id: "photographer", label: "آتلیه عکاسی و فیلم‌برداری", emoji: "📷",
    color: "from-violet-500/20 to-purple-500/20", accentColor: "#7C3AED",
    desc: "پرتفولیو، رزرو و پکیج‌ها",
    blocks: [
      txt("آتلیه تخصصی عکاسی و فیلم‌برداری — عروسی، پرتره و تجاری"),
      feat("مشاهده پرتفولیو", "📸"),
      { type: "IMAGE", label: "نمونه کار", data: { imageUrl: "" } },
      wa("رزرو عکاسی", "سلام، می‌خوام برای عکاسی رزرو کنم"),
      link("قیمت پکیج‌ها", "💰"),
      insta("گالری اینستاگرام"),
    ],
  },
  {
    id: "cafe", label: "کافه و رستوران", emoji: "☕",
    color: "from-amber-500/20 to-yellow-500/20", accentColor: "#D97706",
    desc: "منو، رزرو میز و سفارش آنلاین",
    blocks: [
      txt("کافه‌ای دنج در قلب شهر — قهوهٔ تخصصی و دسر خانگی"),
      feat("مشاهدهٔ منو", "☕"),
      order("سفارش آنلاین"),
      tel("رزرو میز"),
      map("موقعیت کافه"),
      insta(),
    ],
  },
  {
    id: "realstate", label: "مشاور املاک", emoji: "🏠",
    color: "from-green-500/20 to-emerald-500/20", accentColor: "#10B981",
    desc: "آگهی‌ها، مشاوره و آدرس دفتر",
    blocks: [
      txt("مشاور رسمی املاک — خرید، فروش، رهن و اجاره"),
      feat("آگهی‌های موجود", "🏠"),
      wa("مشاورهٔ رایگان", "سلام، برای ملک مشاوره می‌خوام"),
      tel("تماس مستقیم"),
      tg("کانال فایل‌ها"),
      map("آدرس دفتر"),
    ],
  },

  // ── شروع از صفر ──
  {
    id: "blank", label: "شروع از صفر", emoji: "✨",
    color: "from-gray-500/10 to-gray-400/10", accentColor: "#6B7280",
    desc: "صفحهٔ خالی بدون بلوک پیش‌فرض",
    blocks: [],
  },
];
