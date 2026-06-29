"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, UserCheck, UserX, Search, Crown, Clock } from "lucide-react";
import { adminApi, fmtDate } from "@/lib/api";

interface Admin {
  id: string;
  email?: string;
  phone?: string;
  role: "ADMIN" | "SUPER_ADMIN";
  lastLoginAt?: string;
  createdAt: string;
}

interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  createdAt: string;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "SUPER_ADMIN")
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full font-medium">
        <Crown size={11} /> سوپر ادمین
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-medium">
      <Shield size={11} /> ادمین
    </span>
  );
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAdmins();
      setAdmins(data);
    } catch {
      toast.error("خطا در بارگذاری لیست ادمین‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setUsers([]); return; }
    try {
      setUserLoading(true);
      const data = await adminApi.getUsers({ search: q });
      setUsers(data);
    } catch {
      toast.error("خطا در جستجوی کاربران");
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchUsers(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const demote = async (id: string, identifier: string) => {
    if (!confirm(`آیا از تنزیل "${identifier}" به کاربر عادی مطمئنید؟`)) return;
    try {
      setActingId(id);
      await adminApi.setRole(id, "USER");
      toast.success("دسترسی ادمین لغو شد");
      loadAdmins();
    } catch {
      toast.error("خطا در تغییر نقش");
    } finally {
      setActingId(null);
    }
  };

  const promote = async (id: string, identifier: string) => {
    if (!confirm(`آیا از ارتقای "${identifier}" به ادمین مطمئنید؟`)) return;
    try {
      setActingId(id);
      await adminApi.setRole(id, "ADMIN");
      toast.success("کاربر به ادمین ارتقا یافت");
      setUsers([]);
      setSearch("");
      loadAdmins();
    } catch {
      toast.error("خطا در تغییر نقش");
    } finally {
      setActingId(null);
    }
  };

  const getId = (u: { email?: string; phone?: string }) => u.email || u.phone || "—";

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">مدیریت ادمین‌ها</h1>
        <p className="text-white/50 text-sm mt-1">فقط برای سوپر ادمین</p>
      </div>

      {/* Current Admins */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <Shield size={16} className="text-white/50" />
          <h2 className="text-white font-semibold">ادمین‌های فعلی</h2>
          <span className="text-white/30 text-sm">({admins.length})</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-white/50">در حال بارگذاری...</div>
        ) : admins.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30">هیچ ادمینی یافت نشد</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="text-right px-5 py-3 font-medium">شناسه</th>
                <th className="text-right px-5 py-3 font-medium">نقش</th>
                <th className="text-right px-5 py-3 font-medium">آخرین ورود</th>
                <th className="text-right px-5 py-3 font-medium">تاریخ ساخت</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-4">
                    <div className="text-white font-medium">{getId(admin)}</div>
                  </td>
                  <td className="px-5 py-4"><RoleBadge role={admin.role} /></td>
                  <td className="px-5 py-4 text-white/50">
                    {admin.lastLoginAt ? (
                      <span className="flex items-center gap-1"><Clock size={12} /> {fmtDate(admin.lastLoginAt)}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-4 text-white/50">{fmtDate(admin.createdAt)}</td>
                  <td className="px-5 py-4">
                    {admin.role !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => demote(admin.id, getId(admin))}
                        disabled={actingId === admin.id}
                        className="flex items-center gap-1.5 text-xs bg-red-500/15 text-red-400 hover:bg-red-500/25 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        <UserX size={13} />
                        تنزیل به کاربر
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Promote Users */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <UserCheck size={16} className="text-white/50" />
          <h2 className="text-white font-semibold">ارتقای کاربر به ادمین</h2>
        </div>
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="input-base w-full pr-9"
            placeholder="جستجو با ایمیل یا شماره..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {userLoading && <div className="text-white/40 text-sm text-center py-4">در حال جستجو...</div>}
        {!userLoading && users.length > 0 && (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{user.name || getId(user)}</p>
                  {user.name && <p className="text-white/40 text-xs">{getId(user)}</p>}
                  <p className="text-white/30 text-xs">{fmtDate(user.createdAt)}</p>
                </div>
                <button
                  onClick={() => promote(user.id, user.name || getId(user))}
                  disabled={actingId === user.id}
                  className="flex items-center gap-1.5 text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  <Shield size={13} />
                  ارتقا به ادمین
                </button>
              </div>
            ))}
          </div>
        )}
        {!userLoading && search.trim() && users.length === 0 && (
          <div className="text-white/30 text-sm text-center py-4">کاربری یافت نشد</div>
        )}
      </div>
    </div>
  );
}
