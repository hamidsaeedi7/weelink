import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BioPageClient } from "./BioPageClient";

interface Props {
  params: { slug: string };
}

async function getShop(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/shops/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShop(params.slug);
  if (!shop) return { title: "صفحه یافت نشد" };
  return {
    title: `${shop.name} | ویلینک`,
    description: shop.bio || `صفحه بیو ${shop.name}`,
    openGraph: {
      title: shop.name,
      description: shop.bio || "",
      images: shop.avatarUrl ? [shop.avatarUrl] : [],
    },
  };
}

export default async function BioPage({ params }: Props) {
  const shop = await getShop(params.slug);
  if (!shop) notFound();
  return <BioPageClient shop={shop} />;
}
