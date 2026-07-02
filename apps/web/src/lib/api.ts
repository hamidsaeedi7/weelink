import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error);
  },
);

export default api;

// ─── Shops ───────────────────────────────────────────────────────────────────
export const shopsApi = {
  create: (data: { name: string; slug: string; bio?: string }) =>
    api.post("/shops", data),
  getBySlug: (slug: string) => api.get(`/shops/${slug}`),
  getMine: () => api.get("/me/shop"),
  update: (data: Record<string, any>) => api.put("/me/shop", data),
  checkSlug: (slug: string) => api.get(`/shops/check-slug?slug=${slug}`),
};

// ─── Blocks ──────────────────────────────────────────────────────────────────
export const blocksApi = {
  getAll: () => api.get("/blocks"),
  create: (data: Record<string, any>) => api.post("/blocks", data),
  update: (id: string, data: Record<string, any>) => api.put(`/blocks/${id}`, data),
  remove: (id: string) => api.delete(`/blocks/${id}`),
  reorder: (ids: string[]) => api.put("/blocks/reorder", { ids }),
  click: (id: string) => api.post(`/blocks/${id}/click`),
};

// ─── Upload ──────────────────────────────────────────────────────────────────
export const uploadApi = {
  image: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (res as any).url as string;
  },
  video: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/upload/video", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return (res as any).url as string;
  },
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: () => api.get("/products"),
  getPublic: (slug: string) => api.get(`/shops/${slug}/products`),
  create: (data: Record<string, any>) => api.post("/products", data),
  update: (id: string, data: Record<string, any>) => api.put(`/products/${id}`, data),
  remove: (id: string) => api.delete(`/products/${id}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: Record<string, any>) => api.post("/orders", data),
  getMine: (page?: number, status?: string) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (status) params.set("status", status);
    return api.get(`/orders/mine?${params}`);
  },
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
};

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const couponsApi = {
  getAll: () => api.get("/coupons"),
  create: (data: Record<string, any>) => api.post("/coupons", data),
  validate: (code: string, total: number) =>
    api.post("/coupons/validate", { code, total }),
  remove: (id: string) => api.delete(`/coupons/${id}`),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: (days = 30) => api.get(`/analytics/dashboard?days=${days}`),
  getReferers: () => api.get("/analytics/referers"),
};

// ─── Tickets ─────────────────────────────────────────────────────────────────
export const ticketsApi = {
  getAll: () => api.get("/tickets"),
  getOne: (id: string) => api.get(`/tickets/${id}`),
  create: (data: { subject: string; message: string; priority?: string }) =>
    api.post("/tickets", data),
  reply: (id: string, message: string) => api.post(`/tickets/${id}/reply`, { message }),
  close: (id: string) => api.put(`/tickets/${id}/close`),
};

// ─── User Account ─────────────────────────────────────────────────────────────
export const accountApi = {
  getMe: () => api.get("/users/me"),
  updateProfile: (data: { email?: string; phone?: string }) =>
    api.put("/users/me/profile", data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post("/users/me/change-password", { oldPassword, newPassword }),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  requestPlanPayment: (months: number): Promise<{ trackId: string; gatewayUrl: string }> =>
    api.post("/payments/plan/request", { months }),
  verifyPlanPayment: (trackId: string, success: string) =>
    api.post("/payments/plan/verify", { trackId, success }),
};

// ─── Custom Domains ───────────────────────────────────────────────────────────
export const domainsApi = {
  addDomain: (domain: string) => api.post("/domains", { domain }),
  getMyDomain: () => api.get("/domains"),
  verifyDomain: () => api.post("/domains/verify"),
  removeDomain: () => api.delete("/domains"),
};

// ─── A/B Testing ─────────────────────────────────────────────────────────────
export const abTestingApi = {
  getTests: () => api.get("/ab-tests"),
  createTest: (data: any) => api.post("/ab-tests", data),
  endTest: (id: string, winner: string) => api.put(`/ab-tests/${id}/end`, { winner }),
  pauseTest: (id: string) => api.put(`/ab-tests/${id}/pause`),
};
