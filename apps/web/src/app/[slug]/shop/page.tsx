import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ShopClient from "./ShopClient";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getShopData(slug: string) {
  try {
    const [shopRes, productsRes] = await Promise.all([
      fetch(`${API}/api/v1/shops/${slug}`, { next: { revalidate: 60 } }),
      fetch(`${API}/api/v1/shops/${slug}/products`, { next: { revalidate: 60 } }),
    ]);
    if (!shopRes.ok) return null;
    return {
      shop: await shopRes.json(),
      products: productsRes.ok ? await productsRes.json() : [],
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getShopData(params.slug);
  if (!data) return { title: "فروشگاه یافت نشد" };
  const { shop } = data;
  return {
    title: `فروشگاه ${shop.data?.name || shop.name}`,
    description: shop.data?.bio || shop.bio,
  };
}

export default async function ShopPage({ params }: { params: { slug: string } }) {
  const data = await getShopData(params.slug);
  if (!data) notFound();
  const shop = data.shop.data || data.shop;
  const products = Array.isArray(data.products.data) ? data.products.data : data.products;
  return <ShopClient shop={shop} products={products} slug={params.slug} />;
}
