import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      window.location.href = "/modir/login";
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;

export const adminApi = {
  // Dashboard
  stats: (period?: number)        => api.get("/admin/stats", { params: period ? { period } : undefined }),
  deleteUser: (id: string)        => api.delete(`/admin/users/${id}`),
  // Users
  getUsers: (p?: any)            => api.get("/admin/users", { params: p }),
  getUser: (id: string)          => api.get(`/admin/users/${id}`),
  updateUser: (id: string, d: any) => api.put(`/admin/users/${id}`, d),
  getActiveUsers: ()             => api.get("/admin/users/active"),
  // Finance
  getFinance: (page?: number)    => api.get("/admin/finance", { params: { page } }),
  getGatewayReport: ()           => api.get("/admin/finance/gateway"),
  // Tickets
  getTickets: (status?: string)  => api.get("/admin/tickets", { params: { status } }),
  replyTicket: (id: string, message: string) => api.post(`/admin/tickets/${id}/reply`, { message }),
  setTicketStatus: (id: string, status: string) => api.put(`/admin/tickets/${id}/status`, { status }),
  // Blog
  getBlogPosts: (page?: number)  => api.get("/admin/blog", { params: { page } }),
  getBlogPost: (id: string)      => api.get(`/admin/blog/${id}`),
  createBlogPost: (d: any)       => api.post("/admin/blog", d),
  updateBlogPost: (id: string, d: any) => api.put(`/admin/blog/${id}`, d),
  deleteBlogPost: (id: string)   => api.delete(`/admin/blog/${id}`),
  // Content
  getContent: (id: string)       => api.get(`/admin/content/${id}`),
  updateContent: (id: string, d: any) => api.put(`/admin/content/${id}`, d),
  // Landing Pages
  getLandingPages: ()            => api.get("/admin/landing-pages"),
  getLandingPage: (id: string)   => api.get(`/admin/landing-pages/${id}`),
  createLandingPage: (d: any)    => api.post("/admin/landing-pages", d),
  updateLandingPage: (id: string, d: any) => api.put(`/admin/landing-pages/${id}`, d),
  deleteLandingPage: (id: string) => api.delete(`/admin/landing-pages/${id}`),
  // Notifications
  getNotifications: ()           => api.get("/admin/notifications"),
  sendNotification: (d: any)     => api.post("/admin/notifications", d),
  deleteNotification: (id: string) => api.delete(`/admin/notifications/${id}`),
  // Coupons
  getCoupons: ()                 => api.get("/admin/coupons"),
  createCoupon: (d: any)         => api.post("/admin/coupons", d),
  deleteCoupon: (id: string)     => api.delete(`/admin/coupons/${id}`),
  // Settings
  getSettings: ()                => api.get("/admin/settings"),
  updateSettings: (d: any)       => api.put("/admin/settings", d),
  changeCredentials: (d: any)    => api.post("/admin/settings/credentials", d),
  // Admins
  getAdmins: ()                  => api.get("/admin/admins"),
  setRole: (id: string, role: string) => api.put(`/admin/admins/${id}/role`, { role }),
  // Logs
  getLogs: (page?: number)       => api.get("/admin/logs", { params: { page } }),
  // Stats
  getToolStats: ()               => api.get("/admin/tool-stats"),
  getServerStats: ()             => api.get("/admin/server-stats"),
  // Upload
  uploadImage: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (res as any).url as string;
  },
};

export function fmtPrice(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("fa-IR");
}

export function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "همین الان";
  if (m < 60) return `${m} دقیقه پیش`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ساعت پیش`;
  return `${Math.floor(h / 24)} روز پیش`;
}
