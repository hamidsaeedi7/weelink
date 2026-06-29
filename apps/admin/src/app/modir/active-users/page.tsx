"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, timeAgo } from "@/lib/api";
import { Users, RefreshCw, ExternalLink } from "lucide-react";

type Plan = "FREE" | "PRO";

interface ActiveUser {
  id: string;
  email?: string;
  phone?: string;
  plan: Plan;
  lastLoginAt: string;
  shop?: { slug: string; name: string };
}

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        plan === "PRO"
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {plan}
    </span>
  );
}

function AvatarInitial({ value }: { value: string }) {
  const char = (value || "?")[0].toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
      <span className="text-orange-700 dark:text-orange-300 font-semibold text-sm">{char}</span>
    </div>
  );
}

export default function ActiveUsersPage() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchActiveUsers = useCallback(async () => {
    try {
      const data = await adminApi.getActiveUsers();
      setUsers(data.users ?? data);
      setLastUpdated(new Date());
    } catch {
      console.error("خطا در دریافت کاربران فعال");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveUsers]);

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">کاربران فعال</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            کاربران فعال در ۲۴ ساعت گذشته
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              بروزرسانی: {lastUpdated.toLocaleTimeString("fa-IR")}
            </span>
          )}
          <button
            onClick={fetchActiveUsers}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            بازخوانی
          </button>
        </div>
      </div>

      {/* Stats header */}
      <div className="glass-card p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <Users size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">کاربر فعال</p>
        </div>
        <div className="mr-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-green-600 dark:text-green-400">بروزرسانی خودکار هر ۳۰ ثانیه</span>
        </div>
      </div>

      {/* User list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-orange-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Users size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              هیچ کاربر فعالی در ۲۴ ساعت گذشته وجود ندارد
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              کاربران پس از ورود به سیستم اینجا نمایش داده می‌شوند
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <AvatarInitial value={user.email || user.phone || "?"} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {user.email || user.phone}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <PlanBadge plan={user.plan} />
                    {user.shop && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        فروشگاه: {user.shop.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-left">
                    <p className="text-xs text-gray-400 dark:text-gray-500">آخرین ورود</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {timeAgo(user.lastLoginAt)}
                    </p>
                  </div>
                  {user.shop?.slug && (
                    <a
                      href={`/${user.shop.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                      title="مشاهده فروشگاه"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
