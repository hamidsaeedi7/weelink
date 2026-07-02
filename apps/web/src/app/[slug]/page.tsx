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

const SITE_URL = "https://weeelink.ir";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = await getShop(params.slug);
  if (!shop) return { title: "صفحه یافت نشد" };

  const url = `${SITE_URL}/${params.slug}`;
  const title = `${shop.name} | ویلینک`;
  const description = shop.bio || `صفحه بیو ${shop.name} در ویلینک`;
  const images = shop.avatarUrl ? [{ url: shop.avatarUrl }] : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: shop.name,
      description,
      url,
      siteName: "ویلینک",
      locale: "fa_IR",
      type: "profile",
      images,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: shop.name,
      description,
      images: shop.avatarUrl ? [shop.avatarUrl] : undefined,
    },
  };
}

export default async function BioPage({ params }: Props) {
  const shop = await getShop(params.slug);
  if (!shop) notFound();

  const url = `${SITE_URL}/${params.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateModified: shop.updatedAt || undefined,
    mainEntity: {
      "@type": "Organization",
      name: shop.name,
      description: shop.bio || undefined,
      url,
      ...(shop.avatarUrl ? { logo: shop.avatarUrl, image: shop.avatarUrl } : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BioPageClient shop={shop} />
    </>
  );
}
