import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// دامنه‌های خود پلتفرم — روی این‌ها هرگز نباید ری‌رایت بزنیم
const FIRST_PARTY_HOSTS = new Set([
  "weeelink.ir",
  "www.weeelink.ir",
  "localhost",
  "localhost:3000",
  "127.0.0.1",
  "127.0.0.1:3000",
]);

// کش کوتاه‌مدت درون‌حافظه‌ای برای جلوگیری از فراخوانی API روی هر ریکوئست
const cache = new Map<string, { slug: string | null; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function resolveSlug(host: string): Promise<string | null> {
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.slug;

  try {
    const res = await fetch(`${API_URL}/api/v1/domains-public/resolve?host=${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json().catch(() => ({}) as any);
    const slug: string | null = data?.slug ?? null;
    cache.set(host, { slug, expires: Date.now() + CACHE_TTL_MS });
    return slug;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  if (FIRST_PARTY_HOSTS.has(host)) return NextResponse.next();

  const slug = await resolveSlug(host);
  if (!slug) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${slug}${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|uploads|favicon.ico|sw.js|manifest.json|fonts).*)",
  ],
};
