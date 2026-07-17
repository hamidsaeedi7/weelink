import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CourseDetailClient from "./CourseDetailClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getData(slug: string, id: string) {
  try {
    const [coursesRes, shopRes] = await Promise.all([
      fetch(`${API}/api/v1/shops/${slug}/courses`, { next: { revalidate: 60 } }),
      fetch(`${API}/api/v1/shops/${slug}`, { next: { revalidate: 60 } }),
    ]);
    if (!shopRes.ok) return null;
    const coursesJson = coursesRes.ok ? await coursesRes.json() : [];
    const list = Array.isArray(coursesJson.data) ? coursesJson.data : coursesJson;
    const course = Array.isArray(list) ? list.find((c: any) => c.id === id) : null;
    if (!course) return null;
    return { course, shop: await shopRes.json() };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string; id: string } }): Promise<Metadata> {
  const data = await getData(params.slug, params.id);
  if (!data) return { title: "دوره یافت نشد" };
  const { course } = data;
  return {
    title: course.title,
    description: course.description || `دوره ${course.title}`,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.coverUrl ? [{ url: course.coverUrl }] : [],
    },
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string; id: string } }) {
  const data = await getData(params.slug, params.id);
  if (!data) notFound();
  const shop = data.shop.data || data.shop;
  return <CourseDetailClient slug={params.slug} id={params.id} course={data.course} shop={shop} />;
}
