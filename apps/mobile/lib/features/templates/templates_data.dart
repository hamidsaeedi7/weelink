class TplBlock {
  final String type;
  final String? label;
  final String? url;
  final String? icon;
  final Map<String, dynamic>? data;
  const TplBlock({required this.type, this.label, this.url, this.icon, this.data});

  Map<String, dynamic> toJson() => {
        'type': type,
        if (label != null) 'label': label,
        if (url != null) 'url': url,
        if (icon != null) 'icon': icon,
        if (data != null) 'data': data,
      };
}

class BioTemplate {
  final String id;
  final String label;
  final String emoji;
  final int accentColor; // 0xFFRRGGBB
  final String desc;
  final List<TplBlock> blocks;
  const BioTemplate({required this.id, required this.label, required this.emoji, required this.accentColor, required this.desc, required this.blocks});
}

TplBlock _txt(String content) => TplBlock(type: 'TEXT', data: {'content': content});
TplBlock _feat(String label, [String icon = '⭐']) => TplBlock(type: 'FEATURED', label: label, url: '#', icon: icon);
TplBlock _link(String label, [String icon = '🔗']) => TplBlock(type: 'LINK', label: label, url: '#', icon: icon);
TplBlock _tel([String label = 'تماس تلفنی']) => TplBlock(type: 'PHONE', label: label, url: '02100000000');
TplBlock _wa(String label, String message) => TplBlock(type: 'WHATSAPP', label: label, data: {'phone': '989120000000', 'message': message});
TplBlock _tg([String label = 'کانال تلگرام']) => TplBlock(type: 'MESSENGER', label: label, url: 'yourchannel', data: {'platform': 'telegram'});
TplBlock _insta([String label = 'پیج اینستاگرام']) => TplBlock(type: 'LINK', label: label, url: 'https://instagram.com/', icon: '📸');
TplBlock _map([String label = 'آدرس روی نقشه']) => TplBlock(type: 'MAP', label: label, url: 'https://maps.google.com');
TplBlock _faq(String label, String answer) => TplBlock(type: 'FAQ', label: label, data: {'answer': answer});
TplBlock _order([String label = 'ثبت سفارش آنلاین']) => TplBlock(type: 'ORDER_FORM', label: label, url: 'https://wa.me/989120000000');

final List<BioTemplate> kBioTemplates = [
  BioTemplate(id: 'doctor', label: 'دکتر، پزشک و دندان‌پزشک', emoji: '🩺', accentColor: 0xFF3B82F6, desc: 'نوبت‌دهی، مشاوره، آدرس مطب و داروخانه', blocks: [
    _txt('مطب تخصصی — ویزیت حضوری و مشاورهٔ آنلاین'), _feat('نوبت‌دهی آنلاین', '📅'), _wa('رزرو نوبت واتساپ', 'سلام، می‌خوام نوبت بگیرم'), _tel('تماس با منشی'), _map('آدرس مطب'), _faq('ساعات کاری', 'شنبه تا چهارشنبه ۹ تا ۱۸، پنجشنبه ۹ تا ۱۳'),
  ]),
  BioTemplate(id: 'beauty_clinic', label: 'کلینیک زیبایی', emoji: '💆‍♀️', accentColor: 0xFFEC4899, desc: 'خدمات پوست، مو، لیزر و رزرو نوبت', blocks: [
    _txt('کلینیک تخصصی پوست، مو و زیبایی'), _feat('رزرو وقت مشاوره', '✨'), _link('لیست خدمات و تعرفه', '💅'), _wa('مشاورهٔ رایگان', 'سلام، برای مشاوره پیام دادم'), _insta('نمونه کارها در اینستاگرام'), _map('آدرس کلینیک'),
  ]),
  BioTemplate(id: 'medical_supply', label: 'لوازم سلامت و پزشکی', emoji: '🩹', accentColor: 0xFF14B8A6, desc: 'تجهیزات پزشکی، ارتوپدی و مراقبت', blocks: [
    _txt('فروش تجهیزات پزشکی و لوازم مراقبت در منزل'), _feat('مشاهده محصولات', '🩺'), _order('ثبت سفارش'), _wa('استعلام قیمت', 'سلام، قیمت این محصول چنده؟'), _tel(),
  ]),
  BioTemplate(id: 'pharmacy', label: 'داروخانه', emoji: '💊', accentColor: 0xFF22C55E, desc: 'سفارش دارو، مکمل و لوازم بهداشتی', blocks: [
    _txt('داروخانه — ارسال دارو و مکمل به سراسر شهر'), _feat('سفارش دارو با نسخه', '💊'), _wa('ارسال نسخه', 'سلام، نسخه‌ام رو می‌فرستم'), _tel('تماس با داروخانه'), _faq('ساعات کاری', 'همه‌روزه ۸ صبح تا ۱۲ شب'),
  ]),
  BioTemplate(id: 'coach', label: 'مربی ورزشی و باشگاه', emoji: '💪', accentColor: 0xFFF97316, desc: 'برنامه تمرین، ثبت‌نام کلاس و مشاوره', blocks: [
    _txt('مربی تخصصی فیتنس و تناسب اندام'), _feat('ثبت‌نام دورهٔ آنلاین', '⚡'), _link('برنامهٔ تمرین و تغذیه', '📋'), _wa('مشاورهٔ رایگان', 'سلام، می‌خوام برنامه بگیرم'), _tg('کانال تمرین‌ها'), _insta(),
  ]),
  BioTemplate(id: 'sports_travel', label: 'لوازم ورزشی و سفر', emoji: '🏕️', accentColor: 0xFF84CC16, desc: 'تجهیزات ورزشی، کوهنوردی و کمپینگ', blocks: [
    _txt('فروش لوازم ورزشی، کوهنوردی و سفر'), _feat('جدیدترین محصولات', '🎒'), _order('ثبت سفارش'), _wa('مشاوره خرید', 'سلام، برای خرید نیاز به مشاوره دارم'), _insta(),
  ]),
  BioTemplate(id: 'shop_insta', label: 'فروشگاه اینستاگرام', emoji: '🛍️', accentColor: 0xFFD946EF, desc: 'محصولات، سفارش واتساپ و تخفیف‌ها', blocks: [
    _txt('فروش آنلاین محصولات اورجینال با ارسال به سراسر کشور'), _feat('مشاهده محصولات', '🛍️'), _order('ثبت سفارش آنلاین'),
    TplBlock(type: 'FLASH_SALE', label: 'حراج ویژه', data: {'discount': '۳۰', 'description': 'فقط تا آخر هفته!', 'endDate': ''}),
    _wa('سفارش واتساپ', 'سلام، می‌خوام سفارش بدم'), _tg('کانال تخفیف‌ها'),
  ]),
  BioTemplate(id: 'telegram_shop', label: 'فروشگاه کانال تلگرامی', emoji: '📢', accentColor: 0xFF0EA5E9, desc: 'معرفی کانال، سفارش و پشتیبانی', blocks: [
    _txt('فروشگاه ما در تلگرام — جدیدترین محصولات و تخفیف‌ها'), _tg('عضویت در کانال اصلی'), _feat('مشاهده محصولات', '🛒'), _order('ثبت سفارش'), _wa('پشتیبانی و سفارش', 'سلام، از کانال تلگرام اومدم'),
  ]),
  BioTemplate(id: 'supermarket', label: 'سوپرمارکت و فروشگاه زنجیره‌ای', emoji: '🛒', accentColor: 0xFFF59E0B, desc: 'سفارش آنلاین و ارسال سریع مایحتاج', blocks: [
    _txt('سوپرمارکت آنلاین — ارسال سریع به درب منزل'), _feat('سفارش آنلاین', '🛒'), _order('ثبت سفارش'), _wa('سفارش تلفنی', 'سلام، می‌خوام سفارش بدم'), _tel(), _map('آدرس فروشگاه'),
  ]),
  BioTemplate(id: 'home_appliance', label: 'لوازم خانگی', emoji: '🧺', accentColor: 0xFF6366F1, desc: 'فروش اقساطی و نقدی لوازم خانگی', blocks: [
    _txt('فروش انواع لوازم خانگی — نقد و اقساط'), _feat('محصولات پرفروش', '🧊'), _link('خرید اقساطی', '💳'), _order('ثبت سفارش'), _wa('استعلام قیمت', 'سلام، قیمت این محصول رو می‌خوام'), _map('آدرس فروشگاه'),
  ]),
  BioTemplate(id: 'cosmetics', label: 'آرایشی و بهداشتی', emoji: '💄', accentColor: 0xFFF43F5E, desc: 'محصولات اورجینال آرایشی و مراقبت', blocks: [
    _txt('فروش محصولات آرایشی و بهداشتی اورجینال'), _feat('جدیدترین محصولات', '💄'), _order('ثبت سفارش'),
    TplBlock(type: 'FLASH_SALE', label: 'تخفیف ویژه', data: {'discount': '۲۵', 'description': 'محدود!', 'endDate': ''}),
    _wa('مشاوره خرید', 'سلام، برای انتخاب محصول کمک می‌خوام'), _insta(),
  ]),
  BioTemplate(id: 'fashion', label: 'مد و پوشاک', emoji: '👗', accentColor: 0xFFC026D3, desc: 'پوشاک زنانه، مردانه و بچگانه', blocks: [
    _txt('بوتیک آنلاین — جدیدترین مدل‌های پوشاک'), _feat('کالکشن جدید', '👗'), _order('ثبت سفارش'), _wa('سفارش و سایزبندی', 'سلام، برای سفارش راهنمایی می‌خوام'), _insta('گالری محصولات'),
  ]),
  BioTemplate(id: 'jewelry', label: 'طلا، نقره و بدلیجات', emoji: '💍', accentColor: 0xFFEAB308, desc: 'زیورآلات طلا، نقره و اکسسوری', blocks: [
    _txt('گالری طلا و جواهر — طراحی و فروش زیورآلات'), _feat('جدیدترین طرح‌ها', '💍'), _link('قیمت لحظه‌ای طلا', '📈'), _wa('سفارش و مشاوره', 'سلام، برای خرید مشاوره می‌خوام'), _insta(), _map('آدرس گالری'),
  ]),
  BioTemplate(id: 'petshop', label: 'پت‌شاپ', emoji: '🐾', accentColor: 0xFF10B981, desc: 'غذا، لوازم و خدمات حیوانات خانگی', blocks: [
    _txt('پت‌شاپ — غذا و لوازم حیوانات خانگی با ارسال سریع'), _feat('محصولات پرفروش', '🐕'), _order('ثبت سفارش'), _wa('مشاوره و سفارش', 'سلام، برای پتم نیاز به راهنمایی دارم'), _insta(),
  ]),
  BioTemplate(id: 'baby_toys', label: 'اسباب‌بازی کودک و نوزاد', emoji: '🧸', accentColor: 0xFFFB923C, desc: 'اسباب‌بازی و لوازم کودک و نوزاد', blocks: [
    _txt('فروشگاه اسباب‌بازی و لوازم کودک و نوزاد'), _feat('محصولات جدید', '🧸'), _order('ثبت سفارش'), _wa('سفارش واتساپ', 'سلام، می‌خوام سفارش بدم'), _insta(),
  ]),
  BioTemplate(id: 'local_products', label: 'محصولات بومی و محلی', emoji: '🌾', accentColor: 0xFF65A30D, desc: 'سوغات، صنایع‌دستی و محصولات ارگانیک', blocks: [
    _txt('فروش محصولات بومی، سوغات و صنایع‌دستی اصیل'), _feat('محصولات ویژه', '🌾'), _order('ثبت سفارش'), _wa('سفارش و ارسال', 'سلام، می‌خوام سفارش بدم'), _tg('کانال محصولات'),
  ]),
  BioTemplate(id: 'mobile_shop', label: 'فروش موبایل و قطعات', emoji: '📱', accentColor: 0xFF64748B, desc: 'گوشی، قطعات و لوازم جانبی موبایل', blocks: [
    _txt('فروش موبایل، قطعات و لوازم جانبی — گارانتی معتبر'), _feat('گوشی‌های موجود', '📱'), _link('لیست قیمت روز', '💰'), _order('ثبت سفارش'), _wa('استعلام قیمت', 'سلام، قیمت این گوشی چنده؟'), _map('آدرس فروشگاه'),
  ]),
  BioTemplate(id: 'laptop_shop', label: 'لپ‌تاپ، کامپیوتر و لوازم جانبی', emoji: '💻', accentColor: 0xFF2563EB, desc: 'فروش سیستم، لپ‌تاپ و قطعات کامپیوتر', blocks: [
    _txt('فروش لپ‌تاپ، کامپیوتر و قطعات — مشاورهٔ تخصصی'), _feat('سیستم‌های آماده', '💻'), _link('اسمبل سیستم دلخواه', '🛠️'), _order('ثبت سفارش'), _wa('مشاورهٔ خرید', 'سلام، برای خرید سیستم راهنمایی می‌خوام'),
  ]),
  BioTemplate(id: 'device_repair', label: 'تعمیر موبایل و کامپیوتر', emoji: '🔧', accentColor: 0xFF06B6D4, desc: 'تعمیر تخصصی موبایل، لپ‌تاپ و تبلت', blocks: [
    _txt('تعمیر تخصصی موبایل، لپ‌تاپ و تبلت — تضمین کیفیت'), _feat('ثبت درخواست تعمیر', '🔧'), _wa('پشتیبانی و تعمیر', 'سلام، دستگاهم مشکل داره'), _tel(), _faq('گارانتی تعمیر', 'تمام تعمیرات دارای ۳ ماه گارانتی هستند'), _map('آدرس تعمیرگاه'),
  ]),
  BioTemplate(id: 'print_shop', label: 'خدمات چاپ و کافی‌نت', emoji: '🖨️', accentColor: 0xFF8B5CF6, desc: 'چاپ، تایپ، اسکن و خدمات اداری', blocks: [
    _txt('خدمات چاپ، تایپ، اسکن و امور اداری و دانشجویی'), _feat('ثبت سفارش چاپ', '🖨️'), _wa('ارسال فایل چاپ', 'سلام، فایلم رو برای چاپ می‌فرستم'), _tel(), _map('آدرس'),
  ]),
  BioTemplate(id: 'car_showroom', label: 'نمایشگاه ماشین و موتور', emoji: '🚗', accentColor: 0xFFEF4444, desc: 'خرید، فروش و معاوضهٔ خودرو', blocks: [
    _txt('نمایشگاه اتومبیل — خرید، فروش و معاوضه با بهترین قیمت'), _feat('خودروهای موجود', '🚗'), _link('کارشناسی و قیمت‌گذاری', '🔍'), _wa('مشاورهٔ خرید و فروش', 'سلام، برای خرید/فروش خودرو تماس گرفتم'), _tel(), _map('آدرس نمایشگاه'),
  ]),
  BioTemplate(id: 'car_repair', label: 'تعمیرگاه ماشین و موتور', emoji: '🔩', accentColor: 0xFF71717A, desc: 'تعمیر، سرویس و نوبت‌دهی خودرو', blocks: [
    _txt('تعمیرگاه تخصصی خودرو و موتورسیکلت — سرویس دوره‌ای'), _feat('رزرو نوبت تعمیر', '🔧'), _wa('مشاوره فنی', 'سلام، ماشینم این مشکل رو داره'), _tel(), _faq('خدمات', 'تعمیرات موتور، گیربکس، برق و سرویس دوره‌ای'), _map('آدرس تعمیرگاه'),
  ]),
  BioTemplate(id: 'auto_parts', label: 'لوازم یدکی', emoji: '⚙️', accentColor: 0xFF78716C, desc: 'قطعات و لوازم یدکی خودرو و موتور', blocks: [
    _txt('فروش لوازم یدکی اصلی و های‌کپی — ارسال به سراسر کشور'), _feat('قطعات موجود', '⚙️'), _order('ثبت سفارش'), _wa('استعلام قطعه', 'سلام، این قطعه رو دارید؟'), _tel(),
  ]),
  BioTemplate(id: 'tools', label: 'ابزارآلات و تجهیزات', emoji: '🛠️', accentColor: 0xFFD97706, desc: 'ابزار برقی، دستی و صنعتی', blocks: [
    _txt('فروش ابزارآلات برقی، دستی و تجهیزات صنعتی'), _feat('محصولات پرفروش', '🛠️'), _order('ثبت سفارش'), _wa('مشاوره و استعلام', 'سلام، قیمت این ابزار رو می‌خوام'), _map('آدرس فروشگاه'),
  ]),
  BioTemplate(id: 'freelancer', label: 'فریلنسر', emoji: '🧑‍💻', accentColor: 0xFF8B5CF6, desc: 'نمونه‌کار، رزومه و سفارش پروژه', blocks: [
    _txt('فریلنسر — طراحی، توسعه و خدمات دیجیتال'), _feat('مشاهده نمونه‌کارها', '💼'), _link('دانلود رزومه', '📄'), _wa('سفارش پروژه', 'سلام، یه پروژه دارم می‌خوام صحبت کنیم'), _link('پروفایل لینکدین', '🔗'), _tg('کانال کارها'),
  ]),
  BioTemplate(id: 'digital_marketing', label: 'آژانس دیجیتال مارکتینگ', emoji: '📈', accentColor: 0xFF0EA5E9, desc: 'خدمات تبلیغات، سئو و شبکه‌های اجتماعی', blocks: [
    _txt('آژانس دیجیتال مارکتینگ — رشد کسب‌وکار شما آنلاین'), _feat('مشاورهٔ رایگان', '🚀'), _link('نمونه پروژه‌ها', '📊'), _link('پکیج‌ها و تعرفه', '💰'), _wa('درخواست مشاوره', 'سلام، برای تبلیغات کسب‌وکارم مشاوره می‌خوام'), _insta(),
  ]),
  BioTemplate(id: 'teacher', label: 'مدرس و دوره‌های آموزشی', emoji: '👨‍🏫', accentColor: 0xFF059669, desc: 'ثبت‌نام دوره، نمونه تدریس و مشاوره', blocks: [
    _txt('مدرس و برگزارکنندهٔ دوره‌های آموزشی تخصصی'), _feat('ثبت‌نام دورهٔ جدید', '🎓'),
    TplBlock(type: 'VIDEO', label: 'نمونهٔ تدریس', url: 'https://youtube.com/', data: {'platform': 'youtube'}),
    _link('سرفصل دوره‌ها', '📚'), _wa('مشاورهٔ ثبت‌نام', 'سلام، برای ثبت‌نام دوره سوال دارم'), _tg('کانال آموزشی'),
  ]),
  BioTemplate(id: 'publisher', label: 'انتشارات کتاب', emoji: '📖', accentColor: 0xFFF59E0B, desc: 'فروش کتاب، چاپ اثر و معرفی نویسنده', blocks: [
    _txt('انتشارات — فروش کتاب و چاپ آثار نویسندگان'), _feat('تازه‌های نشر', '📚'), _order('سفارش کتاب'), _link('چاپ کتاب شما', '✍️'), _wa('مشاوره چاپ', 'سلام، می‌خوام کتابم رو چاپ کنم'), _insta(),
  ]),
  BioTemplate(id: 'photographer', label: 'آتلیه عکاسی و فیلم‌برداری', emoji: '📷', accentColor: 0xFF7C3AED, desc: 'پرتفولیو، رزرو و پکیج‌ها', blocks: [
    _txt('آتلیه تخصصی عکاسی و فیلم‌برداری — عروسی، پرتره و تجاری'), _feat('مشاهده پرتفولیو', '📸'),
    TplBlock(type: 'IMAGE', label: 'نمونه کار', data: {'imageUrl': ''}),
    _wa('رزرو عکاسی', 'سلام، می‌خوام برای عکاسی رزرو کنم'), _link('قیمت پکیج‌ها', '💰'), _insta('گالری اینستاگرام'),
  ]),
  BioTemplate(id: 'cafe', label: 'کافه و رستوران', emoji: '☕', accentColor: 0xFFD97706, desc: 'منو، رزرو میز و سفارش آنلاین', blocks: [
    _txt('کافه‌ای دنج در قلب شهر — قهوهٔ تخصصی و دسر خانگی'), _feat('مشاهدهٔ منو', '☕'), _order('سفارش آنلاین'), _tel('رزرو میز'), _map('موقعیت کافه'), _insta(),
  ]),
  BioTemplate(id: 'realstate', label: 'مشاور املاک', emoji: '🏠', accentColor: 0xFF10B981, desc: 'آگهی‌ها، مشاوره و آدرس دفتر', blocks: [
    _txt('مشاور رسمی املاک — خرید، فروش، رهن و اجاره'), _feat('آگهی‌های موجود', '🏠'), _wa('مشاورهٔ رایگان', 'سلام، برای ملک مشاوره می‌خوام'), _tel('تماس مستقیم'), _tg('کانال فایل‌ها'), _map('آدرس دفتر'),
  ]),
  BioTemplate(id: 'blank', label: 'شروع از صفر', emoji: '✨', accentColor: 0xFF6B7280, desc: 'صفحهٔ خالی بدون بلوک پیش‌فرض', blocks: []),
];
