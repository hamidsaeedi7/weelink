import { createShape, createText, uid } from "./presets";
import { EDITOR_VERSION, type Background, type EditorObject, type Project } from "./types";

export interface StoryTemplate {
  key: string;
  label: string;
  category: string;
  background: Background;
  build: () => EditorObject[];
  /** Locked behind the Pro plan — every category keeps at least one free option. */
  pro?: boolean;
}

export const TEMPLATE_CATEGORIES = [
  { key: "all", label: "همه" },
  { key: "sale", label: "فروش و تخفیف" },
  { key: "product", label: "معرفی محصول" },
  { key: "occasion", label: "مناسبت‌ها" },
  { key: "content", label: "محتوا و آموزش" },
];

/** A centred headline block — the shape most templates are built from. */
function headline(text: string, opts: Partial<Parameters<typeof createText>[0]> = {}) {
  return createText({
    name: "عنوان",
    text,
    x: 90, y: 760, width: 900, height: 200,
    fontSize: 104, fontWeight: 700, align: "center",
    ...opts,
  });
}

function sub(text: string, opts: Partial<Parameters<typeof createText>[0]> = {}) {
  return createText({
    name: "زیرعنوان",
    text,
    x: 120, y: 990, width: 840, height: 90,
    fontSize: 44, fontWeight: 400, align: "center",
    fill: "rgba(255,255,255,0.85)",
    ...opts,
  });
}

function badge(text: string, fill: string, opts: Partial<Parameters<typeof createText>[0]> = {}) {
  return createText({
    name: "برچسب",
    text,
    x: 340, y: 600, width: 400, height: 90,
    fontSize: 48, fontWeight: 700, align: "center",
    fill,
    ...opts,
  });
}

export const TEMPLATES: StoryTemplate[] = [
  {
    key: "flash-sale",
    label: "فروش لحظه‌ای",
    category: "sale",
    background: { type: "gradient", from: "#7F1D1D", to: "#FACC15", angle: 150 },
    build: () => [
      createShape("rect", { name: "کادر", x: 80, y: 560, width: 920, height: 620, fill: "rgba(0,0,0,0.42)", cornerRadius: 48 }),
      badge("⚡ فقط امروز", "#FACC15", { y: 620 }),
      headline("فروش لحظه‌ای", { y: 730, fontSize: 112 }),
      sub("تا ۷۰٪ تخفیف روی همه محصولات", { y: 900 }),
      createText({ name: "دکمه", text: "همین حالا سفارش بده", x: 240, y: 1040, width: 600, height: 90, fontSize: 40, fontWeight: 700, align: "center", fill: "#FACC15" }),
    ],
  },
  {
    key: "discount",
    label: "کد تخفیف",
    category: "sale",
    pro: true,
    background: { type: "gradient", from: "#0F172A", to: "#14C7A5", angle: 135 },
    build: () => [
      headline("۳۰٪ تخفیف", { y: 700, fontSize: 130 }),
      sub("با کد تخفیف زیر", { y: 880 }),
      createShape("rect", { name: "کادر کد", x: 250, y: 980, width: 580, height: 140, fill: "rgba(255,255,255,0.15)", cornerRadius: 32 }),
      createText({ name: "کد", text: "PAEIZ30", x: 250, y: 1015, width: 580, height: 80, fontSize: 64, fontWeight: 700, align: "center", direction: "ltr", fontFamily: "BebasNeue" }),
    ],
  },
  {
    key: "new-product",
    label: "محصول جدید",
    category: "product",
    background: { type: "gradient", from: "#08090C", to: "#0EA88A", angle: 160 },
    build: () => [
      badge("تازه رسید", "#14C7A5", { y: 560 }),
      headline("محصول جدید ما", { y: 680 }),
      sub("همین حالا ببین و سفارش بده", { y: 880 }),
    ],
  },
  {
    key: "product-price",
    label: "معرفی با قیمت",
    category: "product",
    pro: true,
    background: { type: "gradient", from: "#1E293B", to: "#F97316", angle: 140 },
    build: () => [
      headline("نام محصول", { y: 700 }),
      createShape("rect", { name: "کادر قیمت", x: 300, y: 900, width: 480, height: 120, fill: "rgba(255,255,255,0.16)", cornerRadius: 28 }),
      createText({ name: "قیمت", text: "۴۹۰٬۰۰۰ تومان", x: 300, y: 930, width: 480, height: 70, fontSize: 52, fontWeight: 700, align: "center" }),
    ],
  },
  {
    key: "nowruz",
    label: "عید نوروز",
    category: "occasion",
    background: { type: "gradient", from: "#0EA88A", to: "#CA8A04", angle: 145 },
    build: () => [
      headline("نوروزتان پیروز", { y: 720, fontFamily: "Lalezar", fontSize: 118 }),
      sub("سالی سرشار از شادی و سلامتی", { y: 900 }),
    ],
  },
  {
    key: "yalda",
    label: "شب یلدا",
    category: "occasion",
    pro: true,
    background: { type: "gradient", from: "#3B0764", to: "#7C2D12", angle: 155 },
    build: () => [
      headline("شب یلدا مبارک", { y: 740, fontFamily: "Lalezar", fontSize: 112 }),
      sub("بلندترین شب سال، شیرین‌ترین لحظه‌ها", { y: 920 }),
    ],
  },
  {
    key: "ramadan",
    label: "ماه رمضان",
    category: "occasion",
    pro: true,
    background: { type: "gradient", from: "#1E1B4B", to: "#7C3AED", angle: 150 },
    build: () => [
      headline("رمضان کریم", { y: 740, fontFamily: "Lalezar", fontSize: 118 }),
      sub("قبول باشد", { y: 920 }),
    ],
  },
  {
    key: "blackfriday",
    label: "بلک فرایدی",
    category: "sale",
    pro: true,
    background: { type: "solid", color: "#0A0A0A" },
    build: () => [
      createText({ name: "عنوان", text: "BLACK FRIDAY", x: 60, y: 720, width: 960, height: 160, fontSize: 128, fontWeight: 700, align: "center", direction: "ltr", fontFamily: "BebasNeue" }),
      createShape("rect", { name: "خط", x: 240, y: 900, width: 600, height: 8, fill: "#FACC15", cornerRadius: 4 }),
      sub("تخفیف‌های باورنکردنی", { y: 950 }),
    ],
  },
  {
    key: "course",
    label: "دوره آموزشی",
    category: "content",
    pro: true,
    background: { type: "gradient", from: "#0F172A", to: "#3B82F6", angle: 140 },
    build: () => [
      badge("ثبت‌نام باز است", "#93C5FD", { y: 580 }),
      headline("دوره آموزشی جدید", { y: 700 }),
      sub("ظرفیت محدود — همین حالا ثبت‌نام کن", { y: 900 }),
    ],
  },
  {
    key: "quote",
    label: "نقل قول",
    category: "content",
    background: { type: "gradient", from: "#111827", to: "#374151", angle: 135 },
    build: () => [
      createText({ name: "نقل قول", text: "«موفقیت مجموع تلاش‌های کوچک روزانه است»", x: 120, y: 780, width: 840, height: 300, fontSize: 64, fontWeight: 400, align: "center", lineHeight: 1.6 }),
      sub("— ویلینک", { y: 1120, fontSize: 36 }),
    ],
  },
  {
    key: "announcement",
    label: "اطلاعیه",
    category: "content",
    pro: true,
    background: { type: "gradient", from: "#7C2D12", to: "#F97316", angle: 150 },
    build: () => [
      badge("اطلاعیه", "#FED7AA", { y: 620 }),
      headline("خبر مهم داریم", { y: 740 }),
      sub("جزئیات را در لینک بیو ببینید", { y: 930 }),
    ],
  },
  {
    key: "minimal",
    label: "مینیمال",
    category: "content",
    background: { type: "solid", color: "#FAFAFA" },
    build: () => [
      headline("عنوان شما", { y: 800, fill: "#111827", fontSize: 96 }),
      sub("زیرعنوان کوتاه اینجا", { y: 960, fill: "rgba(17,24,39,0.6)" }),
      createShape("rect", { name: "خط", x: 440, y: 1080, width: 200, height: 6, fill: "#14C7A5", cornerRadius: 3 }),
    ],
  },
];

/** Builds a fresh project from a template. Always new ids, so applying the
 *  same template twice never produces colliding object ids. */
export function projectFromTemplate(tpl: StoryTemplate): Project {
  return {
    version: EDITOR_VERSION,
    id: uid(),
    name: tpl.label,
    canvas: { width: 1080, height: 1920 },
    presetKey: "story",
    pages: [{ id: uid(), background: tpl.background, objects: tpl.build() }],
    updatedAt: new Date().toISOString(),
  };
}
