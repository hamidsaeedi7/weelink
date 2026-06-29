"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, fmtDate, timeAgo } from "@/lib/api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  CheckCircle,
  RefreshCw,
  X,
  User,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type Plan = "FREE" | "PRO";

interface UserItem {
  id: string;
  email?: string;
  phone?: string;
  plan: Plan;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt?: string;
  shop?: { name: string; slug: string };
  ticketCount?: number;
  subscriptionHistory?: { plan: Plan; startsAt: string; expiresAt: string }[];
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

function StatusBadge({ isBlocked }: { isBlocked: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isBlocked
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? "bg-red-500" : "bg-green-500"}`} />
      {isBlocked ? "مسدود" : "فعال"}
    </span>
  );
}

interface UserModalProps {
  user: UserItem;
  onClose: () => void;
  onUpdate: (id: string, data: { isBlocked?: boolean; plan?: Plan }) => void;
  onDelete: (id: string) => void;
}

function UserModal({ user, onClose, onUpdate, onDelete }: UserModalProps) {
  const [updating, setUpdating] = useState(false);

  async function handleBlock() {
    setUpdating(true);
    try {
      await onUpdate(user.id, { isBlocked: !user.isBlocked });
      toast.success(user.isBlocked ? "کاربر فعال شد" : "کاربر مسدود شد");
      onClose();
    } catch {
      toast.error("خطا در به‌روزرسانی کاربر");
    } finally {
      setUpdating(false);
    }
  }

  async function handlePlanChange(plan: Plan) {
    setUpdating(true);
    try {
      await onUpdate(user.id, { plan });
      toast.success("پلن کاربر تغییر کرد");
      onClose();
    } catch {
      toast.error("خطا در تغییر پلن");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`کاربر «${user.email || user.phone}» حذف شود؟ این عملیات برگشت‌پذیر نیست.`)) return;
    setUpdating(true);
    try {
      await onDelete(user.id);
      toast.success("کاربر حذف شد");
      onClose();
    } catch {
      toast.error("خطا در حذف کاربر");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 relative" dir="rtl">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <User size={24} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {user.email || user.phone}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <PlanBadge plan={user.plan} />
              <StatusBadge isBlocked={user.isBlocked} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {user.shop && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">اطلاعات فروشگاه</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {user.shop.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                slug: {user.shop.slug}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">تاریخ عضویت</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">{fmtDate(user.createdAt)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">تیکت‌ها</p>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {user.ticketCount ?? 0} تیکت
              </p>
            </div>
          </div>

          {user.subscriptionHistory && user.subscriptionHistory.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">تاریخچه اشتراک</p>
              <div className="space-y-1">
                {user.subscriptionHistory.map((sub, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800/50 rounded"
                  >
                    <PlanBadge plan={sub.plan} />
                    <span className="text-gray-500 dark:text-gray-400">
                      {fmtDate(sub.startsAt)} — {fmtDate(sub.expiresAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleBlock}
              disabled={updating}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                user.isBlocked
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
              }`}
            >
              {user.isBlocked ? (
                <><CheckCircle size={16} /> آنبلاک</>
              ) : (
                <><Ban size={16} /> بلاک</>
              )}
            </button>
            <select
              onChange={(e) => handlePlanChange(e.target.value as Plan)}
              defaultValue={user.plan}
              className="input-base flex-1 text-sm"
              disabled={updating}
            >
              <option value="FREE">تغییر به FREE</option>
              <option value="PRO">تغییر به PRO</option>
            </select>
            <button
              onClick={handleDelete}
              disabled={updating}
              title="حذف کاربر"
              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"" | "FREE" | "PRO">("");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        page,
        search,
        plan: planFilter || undefined,
      });
      setUsers(data.users ?? data);
    } catch {
      toast.error("خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  }, [page, search, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleUpdate(id: string, data: { isBlocked?: boolean; plan?: Plan }) {
    await adminApi.updateUser(id, data);
    fetchUsers();
  }

  async function handleDelete(id: string) {
    await adminApi.deleteUser(id);
    fetchUsers();
  }

  async function handleBlockToggle(user: UserItem) {
    try {
      await adminApi.updateUser(user.id, { isBlocked: !user.isBlocked });
      toast.success(user.isBlocked ? "کاربر فعال شد" : "کاربر مسدود شد");
      fetchUsers();
    } catch {
      toast.error("خطا در به‌روزرسانی");
    }
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">مدیریت کاربران</h1>
        <button onClick={fetchUsers} className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw size={16} />
          بازخوانی
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو بر اساس ایمیل یا تلفن..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-base w-full pr-9 text-sm"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value as "" | "FREE" | "PRO");
            setPage(1);
          }}
          className="input-base text-sm w-full sm:w-40"
        >
          <option value="">همه پلن‌ها</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw size={24} className="animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    ایمیل/تلفن
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    پلن
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    وضعیت
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    تاریخ عضویت
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    آخرین ورود
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      هیچ کاربری یافت نشد
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                        {user.email || user.phone}
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={user.plan} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isBlocked={user.isBlocked} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {fmtDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {user.lastLoginAt ? timeAgo(user.lastLoginAt) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="مشاهده"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleBlockToggle(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.isBlocked
                                ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            }`}
                            title={user.isBlocked ? "آنبلاک" : "بلاک"}
                          >
                            {user.isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">صفحه {page}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={14} />
              قبلی
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              بعدی
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </div>

      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
