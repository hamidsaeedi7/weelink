import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

interface Post {
  id: string;
  slug?: string;
  title: string;
  content: string;
  createdAt: string;
  author?: { name?: string };
}

async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/blog/public/${id}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json || null;
  } catch {
    return null;
  }
}

function formatPersianDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPost(params.id);
  return {
    title: post ? `${post.title} | وبلاگ ویلینک` : "مطلب | وبلاگ ویلینک",
    description: post
      ? post.content.replace(/<[^>]+>/g, "").slice(0, 160)
      : undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await getPost(params.id);

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0F]" dir="rtl">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600
                     dark:hover:text-blue-400 transition-colors mb-10 group"
        >
          <span className="group-hover:translate-x-1 transition-transform">→</span>
          بازگشت به وبلاگ
        </Link>

        <article>
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-snug mb-4">
              {post.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{formatPersianDate(post.createdAt)}</span>
              {post.author?.name && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-400" />
                  <span>{post.author.name}</span>
                </>
              )}
            </div>
          </header>

          <div
            className="prose prose-lg dark:prose-invert max-w-none
                       prose-headings:font-bold prose-a:text-blue-600
                       dark:prose-a:text-blue-400 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/[0.06]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600
                       dark:text-blue-400 hover:underline group"
          >
            <span className="group-hover:translate-x-1 transition-transform">→</span>
            مشاهده همه مطالب
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
