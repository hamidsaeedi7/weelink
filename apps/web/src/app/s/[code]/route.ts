import { NextRequest, NextResponse } from "next/server";

// Short-link redirect on the web domain (weeelink.ir/s/CODE). The API exposes
// the redirect at /api/v1/s/:code (302 → original URL); we resolve it here and
// forward the browser so the short link actually works instead of 404ing.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const res = await fetch(`${API}/api/v1/s/${encodeURIComponent(params.code)}`, {
      redirect: "manual",
    });
    const loc = res.headers.get("location");
    if (loc) return NextResponse.redirect(loc, 302);
  } catch {
    /* fall through to home */
  }
  return NextResponse.redirect(new URL("/", req.url), 302);
}
