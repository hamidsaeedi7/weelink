import { getBgTemplate, bgTemplateBackground } from "@/lib/bg-templates";

export const BIO_THEMES = [
  { id: "modern", label: "مدرن" },
  { id: "glass", label: "گلس‌مورفیسم" },
  { id: "neo", label: "نئومورفیسم" },
  { id: "clay", label: "کلی‌مورفیسم" },
  { id: "bento", label: "بنتو گرید" },
  { id: "minimal", label: "مینیمال" },
] as const;

export const BIO_MODES = [
  { id: "light", label: "روشن" },
  { id: "dark", label: "تیره" },
] as const;

export type BioThemeId = (typeof BIO_THEMES)[number]["id"];
export type BioModeId = (typeof BIO_MODES)[number]["id"];

/**
 * Only "modern" and "glass" honour the seller's own background photo or
 * gradient template. The flat themes define their own surface and would
 * break underneath a photo: neo's emboss is invisible unless the page is
 * exactly the card colour, and clay/bento/minimal rely on a known-contrast
 * backdrop for their text colours to stay legible.
 */
export function isAtmospheric(theme: string) {
  return theme === "modern" || theme === "glass";
}

/**
 * Resolves the page backdrop for a shop. Falls through to the CSS variable
 * so the theme's own light/dark backdrop stays defined in one place
 * (globals.css) — this is shared by the live bio page and the dashboard
 * theme previews so the two cannot drift apart.
 */
export function resolveBioBackground(shop: any, theme: string): string {
  if (!isAtmospheric(theme)) return "var(--bio-page-bg)";

  const bg = shop?.bgImageUrl;
  if (bg) {
    return `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bg}) center/cover no-repeat`;
  }
  const template = getBgTemplate(shop?.bgTemplate);
  if (template) return bgTemplateBackground(template);

  return "var(--bio-page-bg)";
}
