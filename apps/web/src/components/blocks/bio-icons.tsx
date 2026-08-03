"use client";

import {
  Truck, ShieldCheck, BadgeCheck, CreditCard, RotateCcw, Headphones, Clock,
  MapPin, Phone, Star, Heart, Gift, Percent, Tag, ShoppingBag, ShoppingCart,
  Package, Store, Sparkles, Flame, Zap, Award, ThumbsUp, Users, UserCheck,
  Calendar, CalendarCheck, BookOpen, GraduationCap, FileText, Download,
  Camera, Image as ImageIcon, Video, Music, Mic, Palette, Scissors, Brush,
  Wrench, Hammer, Car, Bike, Home, Building2, Trees, Leaf, Coffee, UtensilsCrossed,
  Cake, Apple, Pill, Stethoscope, Dumbbell, Shirt, Watch, Gem, Baby, Dog,
  Laptop, Smartphone, Monitor, Printer, Wifi, Globe, Send, MessageCircle,
  Mail, Search, Filter, Grid3x3, List, TrendingUp, BarChart3, Wallet, Banknote,
} from "lucide-react";

/**
 * A curated, closed set of icons sellers can pick for trust bars, category
 * chips, price lists and bottom navs. Closed on purpose: an open lucide
 * name field would let a typo render nothing on a live public page, and the
 * whole lucide bundle is far too large to ship to the bio page.
 */
export const BIO_ICON_MAP = {
  truck: Truck, "shield-check": ShieldCheck, "badge-check": BadgeCheck,
  "credit-card": CreditCard, "rotate-ccw": RotateCcw, headphones: Headphones,
  clock: Clock, "map-pin": MapPin, phone: Phone, star: Star, heart: Heart,
  gift: Gift, percent: Percent, tag: Tag, "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart, package: Package, store: Store,
  sparkles: Sparkles, flame: Flame, zap: Zap, award: Award, "thumbs-up": ThumbsUp,
  users: Users, "user-check": UserCheck, calendar: Calendar,
  "calendar-check": CalendarCheck, "book-open": BookOpen,
  "graduation-cap": GraduationCap, "file-text": FileText, download: Download,
  camera: Camera, image: ImageIcon, video: Video, music: Music, mic: Mic,
  palette: Palette, scissors: Scissors, brush: Brush, wrench: Wrench,
  hammer: Hammer, car: Car, bike: Bike, home: Home, building: Building2,
  trees: Trees, leaf: Leaf, coffee: Coffee, utensils: UtensilsCrossed,
  cake: Cake, apple: Apple, pill: Pill, stethoscope: Stethoscope,
  dumbbell: Dumbbell, shirt: Shirt, watch: Watch, gem: Gem, baby: Baby,
  dog: Dog, laptop: Laptop, smartphone: Smartphone, monitor: Monitor,
  printer: Printer, wifi: Wifi, globe: Globe, send: Send,
  "message-circle": MessageCircle, mail: Mail, search: Search, filter: Filter,
  grid: Grid3x3, list: List, "trending-up": TrendingUp, chart: BarChart3,
  wallet: Wallet, banknote: Banknote,
} as const;

export type BioIconName = keyof typeof BIO_ICON_MAP;

export const BIO_ICON_NAMES = Object.keys(BIO_ICON_MAP) as BioIconName[];

/**
 * Renders a picked icon. Unknown or empty names fall back to `fallback`
 * (default: a neutral star) rather than rendering nothing — a blank slot in
 * a trust bar reads as a broken page.
 */
export function BioIcon({
  name,
  className = "w-5 h-5",
  style,
  fallback = "star",
}: {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  fallback?: BioIconName;
}) {
  const Cmp = BIO_ICON_MAP[(name as BioIconName)] || BIO_ICON_MAP[fallback];
  return <Cmp aria-hidden="true" className={className} style={style} />;
}
