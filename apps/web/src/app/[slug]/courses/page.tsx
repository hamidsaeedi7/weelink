import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CoursesClient from "./CoursesClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// See [slug]/page.tsx — a Next Data Cache entry here is stale-while-
// revalidate and would serve the previous course list/prices after an edit.
// force-dynamic also overrides the root layout's revalidate=3600.
export const dynamic = "force-dynamic";

async function getData(slug: string) {
  try {
    const [coursesRes, shopRes] = await Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/courses`, { cache: "no-store" }),
      fetch(`${API}/api/v1/shops/${slug}`, { cache: "no-store" }),
    ]);
    if (!shopRes.ok) return null;
    return {
      courses: coursesRes.ok ? await coursesRes.json() : [],
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
    title: `دوره‌های آموزشی ${shop.name}`,
    description: shop.bio || `دوره‌های آموزشی ${shop.name} در ویلینک`,
  };
}

export default async function CoursesPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug);
  if (!data) notFound();
  const courses = Array.isArray(data.courses.data) ? data.courses.data : data.courses;
  const shop = data.shop.data || data.shop;
  return <CoursesClient slug={params.slug} courses={courses} shop={shop} />;
}
