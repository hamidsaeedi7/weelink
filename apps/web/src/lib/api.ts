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

// ─── Silent token refresh ─────────────────────────────────────────────────────
// Keeps the user permanently logged in: on a 401 we transparently exchange the
// long-lived refresh_token for a fresh access_token and replay the request.
// Concurrent 401s share a single in-flight refresh so we never stampede.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    // Bare fetch (not the `api` instance) so this call can't recurse on 401.
    const res = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data ?? json;
    if (data.accessToken) localStorage.setItem("access_token", data.accessToken);
    if (data.refreshToken) localStorage.setItem("refresh_token", data.refreshToken);
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // PRO-gated feature hit by a free user → let the UI show an upgrade modal
    if (
      status === 403 &&
      error.response?.data?.code === "PRO_REQUIRED" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent("pro-required"));
    }

    if (status === 401 && typeof window !== "undefined" && original && !original._retried) {
      original._retried = true;
      refreshing = refreshing || refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // refresh failed → session truly over
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
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
