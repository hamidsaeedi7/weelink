import {
  LayoutDashboard, Link2, ShoppingBag, Package, BarChart3,
  Ticket, Settings, Tag, QrCode, Zap,
  Code2, FlaskConical, CalendarDays, FileDown, BookOpen,
  CalendarCheck, Scissors, Users, Handshake, Bot, LayoutTemplate,
  Store, Flame, Globe, ImagePlus,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
  pro?: boolean;
  /** Hidden until the shop has graduated past the bare-minimum setup (see isGraduated). */
  advanced?: boolean;
  /** Still under construction — shown in the nav as a disabled preview
   *  ("به‌زودی") instead of a working link, and left out of search/command
   *  palette results entirely since there's nothing to navigate to yet. */
  comingSoon?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Always-visible, pinned above the grouped navigation. */
export const HOME_ITEM: NavItem = {
  href: "/dashboard", icon: LayoutDashboard, label: "خانه", exact: true,
};

/**
 * Four mega-tabs organized around the real sales cycle (setup → sell →
 * fulfill → grow) instead of the previous five flat, internally-named
 * groups. Items marked `advanced` stay hidden until the shop has at least
 * one block and one product (see isGraduated in DashboardShell) — this
 * keeps day-one cognitive load low without removing anything permanently.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "راه‌اندازی",
    items: [
      { href: "/dashboard/blocks", icon: Link2, label: "لینک‌ها" },
      { href: "/dashboard/shop", icon: Store, label: "تنظیمات صفحه" },
      { href: "/dashboard/templates", icon: LayoutTemplate, label: "قالب‌ها" },
      { href: "/dashboard/qrcode", icon: QrCode, label: "QR Code" },
      { href: "/dashboard/embed", icon: Code2, label: "کد جاسازی" },
      { href: "/dashboard/domains", icon: Globe, label: "دامنه اختصاصی", pro: true, advanced: true },
    ],
  },
  {
    label: "فروش",
    items: [
      { href: "/dashboard/products", icon: ShoppingBag, label: "محصولات فیزیکی" },
      { href: "/dashboard/digital-files", icon: FileDown, label: "فایل دیجیتال", pro: true },
      { href: "/dashboard/courses", icon: BookOpen, label: "دوره‌های آموزشی", pro: true },
      { href: "/dashboard/appointments", icon: CalendarCheck, label: "نوبت‌دهی آنلاین", pro: true },
      { href: "/dashboard/flash-sale", icon: Flame, label: "فلش سیل", pro: true },
      { href: "/dashboard/coupons", icon: Tag, label: "تخفیف‌ها" },
    ],
  },
  {
    label: "تحویل و پیگیری",
    items: [
      { href: "/dashboard/orders", icon: Package, label: "سفارش‌ها" },
      { href: "/dashboard/tickets", icon: Ticket, label: "پشتیبانی" },
    ],
  },
  {
    label: "رشد",
    items: [
      { href: "/dashboard/analytics", icon: BarChart3, label: "آمار", pro: true },
      { href: "/dashboard/affiliate", icon: Handshake, label: "همکاری در فروش", advanced: true },
      { href: "/dashboard/short-links", icon: Scissors, label: "لینک کوتاه", pro: true },
      { href: "/dashboard/audience", icon: Users, label: "مخاطبان", pro: true },
      { href: "/dashboard/auto-reply", icon: Bot, label: "پاسخ خودکار", pro: true },
      { href: "/dashboard/story-studio", icon: ImagePlus, label: "استوری‌ساز", comingSoon: true },
      { href: "/dashboard/content-calendar", icon: CalendarDays, label: "تقویم محتوا", pro: true, advanced: true },
      { href: "/dashboard/ab-testing", icon: FlaskConical, label: "تست A/B", pro: true, advanced: true },
    ],
  },
];

/** Account-level items — kept out of the primary nav, shown near account/logout. */
export const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/dashboard/plans", icon: Zap, label: "ارتقا پلن" },
  { href: "/dashboard/account", icon: Settings, label: "حساب کاربری" },
];

/** The five items pinned to the mobile bottom nav; the rest live behind "بیشتر". */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  HOME_ITEM,
  { href: "/dashboard/orders", icon: Package, label: "سفارش‌ها" },
  { href: "/dashboard/blocks", icon: Link2, label: "لینک‌ها" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "آمار", pro: true },
];

/** Flat list of every destination, for the command palette's search index.
 *  comingSoon items are excluded — there's nowhere for a search hit to go. */
export function allNavItems(): NavItem[] {
  return [HOME_ITEM, ...NAV_GROUPS.flatMap((g) => g.items), ...ACCOUNT_ITEMS].filter((i) => !i.comingSoon);
}

/**
 * A shop "graduates" out of the minimal first-day nav once it has at least
 * one block AND one product — both already present on the `/me/shop`
 * response (`blocks` array + `_count.products`), so this needs no extra
 * API call.
 */
export function isGraduated(shop: any): boolean {
  return Boolean(shop?.blocks?.length > 0 && (shop?._count?.products ?? 0) > 0);
}
