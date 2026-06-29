"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/lib/api";

interface BlogPost {
  id: string;
  title: string;
  author: { email: string };
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await adminApi.getBlogPosts(p);
      setPosts(Array.isArray(data) ? data : (data.posts ?? data.items ?? []));
      setTotalPages(data.pages ?? data.totalPages ?? 1);
    } catch {
      toast.error("خطا در بارگذاری پست‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(page);
  }, [page, loadPosts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`آیا از حذف "${title}" اطمینان دارید؟`)) return;
    try {
      await adminApi.deleteBlogPost(id);
      toast.success("پست حذف شد");
      loadPosts(page);
    } catch {
      toast.error("خطا در حذف پست");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مدیریت وبلاگ</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">مدیریت پست‌های وبلاگ</p>
        </div>
        <Link href="/modir/blog/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          پست جدید
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">پستی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عنوان</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">نویسنده</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">وضعیت</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">بازدید</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">تاریخ</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{post.author?.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.isPublished
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {post.isPublished ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {post.viewCount?.toLocaleString("fa-IR") ?? "۰"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/modir/blog/${post.id}`}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                          title="ویرایش"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            صفحه {page.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
