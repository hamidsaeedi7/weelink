import { notFound } from "next/navigation";
import type { Metadata } from "next";
import FilesClient from "./FilesClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// See [slug]/page.tsx — a Next Data Cache entry here is stale-while-
// revalidate and would serve the previous file list/prices after an edit.
// force-dynamic also overrides the root layout's revalidate=3600.
export const dynamic = "force-dynamic";

async function getData(slug: string) {
  try {
    const [filesRes, shopRes] = await Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/digital-files`, { cache: "no-store" }),
      fetch(`${API}/api/v1/shops/${slug}`, { cache: "no-store" }),
    ]);
    if (!shopRes.ok) return null;
    return {
      files: filesRes.ok ? await filesRes.json() : [],
      shop: await shopRes.json(),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getData(params.slug);
  if (!data) return { title: "فروشگاه یافت نشد" };
  const shop = data.shop.data || data.shop;
  return {
    title: `فایل‌های دیجیتال ${shop.name}`,
    description: shop.bio || `فایل‌های دیجیتال ${shop.name} در ویلینک`,
  };
}

export default async function FilesPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const files = Array.isArray(data.files.data) ? data.files.data : data.files;
  const shop = data.shop.data || data.shop;
  return <FilesClient slug={params.slug} files={files} shop={shop} />;
}
