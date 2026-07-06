"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { ExternalLink, ShoppingBag, FileDown, BookOpen, Zap } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function unwrap(d: any) { return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []; }

// نوار فروشگاه: اگر شاپ محصول/فایل/دوره داشته باشد، لینک عمومی‌شان نمایش داده می‌شود
function StorefrontLinks({ slug, primary }: { slug: string; primary: string }) {
  const [state, setState] = useState({ products: 0, files: 0, courses: 0 });
  useEffect(() => {
    (async () => {
      const [p, f, c] = await Promise.all([
        fetch(`${API}/api/v1/shops/${slug}/products`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/api/v1/shops/${slug}/digital-files`).then((r) => r.json()).catch(() => []),
        fetch(`${API}/api/v1/shops/${slug}/courses`).then((r) => r.json()).catch(() => []),
      ]);
      setState({ products: unwrap(p).length, files: unwrap(f).length, courses: unwrap(c).length });
    })();
  }, [slug]);

  const links = [
    state.products > 0 && { href: `/${slug}/shop`, icon: ShoppingBag, label: "فروشگاه محصولات" },
    state.files > 0 && { href: `/${slug}/files`, icon: FileDown, label: "فایل‌های دیجیتال" },
    state.courses > 0 && { href: `/${slug}/courses`, icon: BookOpen, label: "دوره‌های آموزشی" },
  ].filter(Boolean) as { href: string; icon: any; label: string }[];

  if (!links.length) return null;
  return (
    <div className="space-y-2.5 mb-3">
      {links.map((l) => (
        <a key={l.href} href={l.href}
          className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10
                     hover:bg-white/10 transition-all active:scale-[0.98]"
          style={{ borderColor: `${primary}30` }}>
          <l.icon className="w-5 h-5 shrink-0" style={{ color: primary }} />
          <span className="flex-1 text-sm font-medium text-white">{l.label}</span>
          <ExternalLink className="w-4 h-4 text-white/30 shrink-0" />
        </a>
      ))}
    </div>
  );
}

// نوار فلش‌سیل فعال (از رکوردهای داشبورد فلش‌سیل)
function FlashSaleStrip({ slug, primary }: { slug: string; primary: string }) {
  const [sales, setSales] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API}/api/v1/flash-sales/public/${slug}`).then((r) => r.json()).then((d) => setSales(unwrap(d))).catch(() => {});
  }, [slug]);
  const active = sales.filter((s) => s.isActive !== false && new Date(s.endsAt) > new Date());
  if (!active.length) return null;
  return (
    <div className="space-y-2.5 mb-3">
      {active.map((s) => <FlashCard key={s.id} sale={s} primary={primary} />)}
    </div>
  );
}

function FlashCard({ sale, primary }: { sale: any; primary: string }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(sale.endsAt).getTime() - Date.now()));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [sale.endsAt]);
  if (left <= 0) return null;
  const s = Math.floor(left / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const disc = sale.originalPrice && sale.salePrice
    ? Math.round((1 - Number(sale.salePrice) / Number(sale.originalPrice)) * 100) : 0;
  return (
    <div className="w-full px-4 py-3.5 rounded-2xl border text-center space-y-2"
      style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.05))", borderColor: "rgba(239,68,68,0.3)" }}>
      <div className="flex items-center justify-center gap-2">
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-sm font-bold text-white">{sale.title}</span>
        {disc > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-500 text-white">{disc}٪ تخفیف</span>}
      </div>
      {sale.salePrice && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-white/40 line-through">{Number(sale.originalPrice).toLocaleString("fa-IR")}</span>
          <span className="font-black" style={{ color: primary }}>{Number(sale.salePrice).toLocaleString("fa-IR")} تومان</span>
        </div>
      )}
      <div className="flex items-center justify-center gap-1.5 text-white/80 text-sm font-mono">
        <span className="px-2 py-1 rounded-lg bg-white/10 font-black">{pad(h)}</span>:
        <span className="px-2 py-1 rounded-lg bg-white/10 font-black">{pad(m)}</span>:
        <span className="px-2 py-1 rounded-lg bg-white/10 font-black">{pad(sec)}</span>
      </div>
    </div>
  );
}

interface Shop {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bgImageUrl?: string;
  primaryColor?: string;
  fontFamily?: string;
  themeId?: string;
  blocks: any[];
  ownerPlan?: string;
}

export function BioPageClient({ shop }: { shop: Shop }) {
  const primary = shop.primaryColor || "#F97316";
  const bg = shop.bgImageUrl;

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{
        background: bg
          ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${bg}) center/cover no-repeat`
          : `linear-gradient(160deg, #0A0A0F 0%, #111122 100%)`,
        fontFamily: `'${shop.fontFamily || "Vazirmatn"}', Vazirmatn, sans-serif`,
      }}
    >
      {/* Banner */}
      {shop.bannerUrl && (
        <div className="w-full max-w-lg h-36 relative overflow-hidden">
          <Image src={shop.bannerUrl} alt="" fill sizes="512px" className="object-cover" />
        </div>
      )}

      <div className="w-full max-w-lg px-4 pb-16">
        {/* Profile */}
        <div className="flex flex-col items-center pt-10 pb-6 space-y-3">
          {/* Avatar */}
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 shadow-xl"
            style={{ borderColor: `${primary}60`, boxShadow: `0 0 25px ${primary}30` }}
          >
            {shop.avatarUrl ? (
              <Image src={shop.avatarUrl} alt={shop.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, ${primary}88)` }}
              >
                {shop.name[0]}
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-xl font-black text-white">{shop.name}</h1>

          {/* Bio */}
          {shop.bio && (
            <p className="text-sm text-white/60 text-center max-w-xs leading-relaxed">
              {shop.bio}
            </p>
          )}
        </div>

        {/* فلش‌سیل فعال + لینک فروشگاه/فایل/دوره */}
        <FlashSaleStrip slug={shop.slug} primary={primary} />
        <StorefrontLinks slug={shop.slug} primary={primary} />

        {/* Blocks */}
        <div className="space-y-2.5">
          {shop.blocks.map((block: any) => (
            <BlockRenderer key={block.id} block={block} primaryColor={primary} />
          ))}
        </div>

        {/* "Made with Weelink" badge — free pages only (PRO removes branding) */}
        {shop.ownerPlan !== "PRO" && (
          <a
            href="https://weeelink.ir?ref=badge"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 mt-10 mx-auto w-fit
                       px-3.5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm
                       text-xs text-white/50 hover:text-white hover:border-orange-400/40 transition-all"
          >
            <span>ساخته شده با</span>
            <span className="font-bold text-white/80">ویلینک</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
