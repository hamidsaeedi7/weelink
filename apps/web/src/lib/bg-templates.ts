// قالب‌های آماده پس‌زمینه صفحه بیو — ۴ روشن + ۴ تیره.
// overlay: میزان تیرگی روی گرادیان (بالا/پایین) تا متن سفید همیشه خوانا بماند.
export interface BgTemplate {
  id: string;
  group: "light" | "dark";
  label: string;
  css: string;
  overlay: [number, number];
}

export const BG_TEMPLATES: BgTemplate[] = [
  { id: "light-peach",    group: "light", label: "هلویی",       css: "linear-gradient(160deg, #FDEDE3 0%, #FBC2A9 50%, #F79489 100%)", overlay: [0.32, 0.52] },
  { id: "light-sky",      group: "light", label: "آسمانی",      css: "linear-gradient(160deg, #E3F6FD 0%, #AEE4F2 50%, #7FC8E8 100%)", overlay: [0.32, 0.52] },
  { id: "light-lavender", group: "light", label: "یاسی",        css: "linear-gradient(160deg, #F3E9FD 0%, #DCC3F5 50%, #C9A0EC 100%)", overlay: [0.32, 0.52] },
  { id: "light-citrus",   group: "light", label: "لیمویی",      css: "linear-gradient(160deg, #FFF8E1 0%, #FFE082 50%, #FFCA5C 100%)", overlay: [0.32, 0.52] },
  { id: "dark-navy",      group: "dark",  label: "آبی شب",      css: "linear-gradient(160deg, #0A0F1F 0%, #14213D 50%, #1E3A5F 100%)", overlay: [0.2, 0.4] },
  { id: "dark-ember",     group: "dark",  label: "زغالی",       css: "linear-gradient(160deg, #150F0C 0%, #2E1A10 50%, #4A2313 100%)", overlay: [0.2, 0.4] },
  { id: "dark-forest",    group: "dark",  label: "جنگل تیره",   css: "linear-gradient(160deg, #08120D 0%, #10261A 50%, #163B26 100%)", overlay: [0.2, 0.4] },
  { id: "dark-plum",      group: "dark",  label: "بنفش سلطنتی", css: "linear-gradient(160deg, #120818 0%, #24123A 50%, #341A54 100%)", overlay: [0.2, 0.4] },
];

export function getBgTemplate(id?: string | null): BgTemplate | undefined {
  return id ? BG_TEMPLATES.find((t) => t.id === id) : undefined;
}

/** CSS `background` value for a template, with the readability overlay baked in. */
export function bgTemplateBackground(t: BgTemplate): string {
  return `linear-gradient(rgba(0,0,0,${t.overlay[0]}), rgba(0,0,0,${t.overlay[1]})), ${t.css}`;
}
