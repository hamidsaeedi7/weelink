import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

async function getPosts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/blog/public`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "وبلاگ ویلینک",
  description: "آموزش‌ها، نکات و اخبار ویلینک",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0F] bg-dot-pattern">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-14 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm"
                 style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
              <span className="dot-orange" />
              وبلاگ
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white">
              آموزش‌ها و مطالب
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              نکات و راهنماهای استفاده از ویلینک
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-24 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-4xl"
                   style={{ background: "var(--accent-glow)" }}>
                ✍️
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  به‌زودی مطالب اضافه می‌شود
                </h2>
                <p className="text-gray-500 mt-2">
                  در حال آماده‌سازی محتوای آموزشی هستیم.
                </p>
              </div>
              <Link href="/" className="btn-primary inline-flex">
                بازگشت به صفحه اصلی
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.id}`}
                  className="glass-card p-6 space-y-4 hover:-translate-y-1 transition-all duration-200 group block">
                  {post.coverImage && (
                    <img src={post.coverImage} alt={post.title}
                      className="w-full h-44 object-cover rounded-xl" />
                  )}
                  <div className="space-y-2">
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white
                                   group-hover:text-accent transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                    {post.readTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime} دقیقه
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
