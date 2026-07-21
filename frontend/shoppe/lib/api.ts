const LOCAL_API_BASE = "http://localhost:5000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? LOCAL_API_BASE : "");

type RequestOptions = RequestInit & {
  skipRefresh?: boolean;
  csrfRetried?: boolean;
};

let refreshPromise: Promise<unknown> | null = null;
let csrfToken: string | null = null;

const isAuthCheckEndpoint = (endpoint: string) => endpoint === "/auth/me";
const isRefreshEndpoint = (endpoint: string) => endpoint === "/auth/refresh-token";
const isCsrfEndpoint = (endpoint: string) => endpoint === "/auth/csrf-token";
const requiresCsrfToken = (method?: string) => {
  const normalizedMethod = (method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalizedMethod);
};

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${API_BASE}/auth/csrf-token`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Unable to prepare secure request.");
  }

  const data = (await response.json()) as { csrfToken: string };
  csrfToken = data.csrfToken;
  return csrfToken;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is required outside development.");
  }

  const { skipRefresh, csrfRetried, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (requiresCsrfToken(fetchOptions.method) && !isCsrfEndpoint(endpoint)) {
    headers["X-CSRF-Token"] = await getCsrfToken();
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 403 && requiresCsrfToken(fetchOptions.method) && !csrfRetried) {
    const error = await response
      .clone()
      .json()
      .catch(() => ({ message: "" }));

    if (
      error.message === "Invalid CSRF token" ||
      error.message === "Your session expired. Please refresh the page and try again."
    ) {
      csrfToken = null;
      return request<T>(endpoint, {
        ...options,
        csrfRetried: true,
      });
    }
  }

  if (
    response.status === 401 &&
    !skipRefresh &&
    !isAuthCheckEndpoint(endpoint) &&
    !isRefreshEndpoint(endpoint)
  ) {
    if (!refreshPromise) {
      refreshPromise = request("/auth/refresh-token", {
        method: "POST",
        skipRefresh: true,
      }).finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
    } catch {
      throw new Error("Please log in to continue.");
    }

    return request<T>(endpoint, {
      ...options,
      skipRefresh: true,
    });
  }


  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));

    if (response.status === 401 && isAuthCheckEndpoint(endpoint)) {
      throw new Error("Please log in to continue.");
    }

    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipRefresh: true,
    }),

  register: (data: { name: string; email: string; password: string }) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipRefresh: true,
    }),

  verifyEmail: (email: string, code: string) =>
    request("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
      skipRefresh: true,
    }),

  resendVerification: (email: string) =>
    request("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipRefresh: true,
    }),

  forgotPassword: (email: string) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipRefresh: true,
    }),

  resetPassword: (email: string, code: string, password: string) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, password }),
      skipRefresh: true,
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
      skipRefresh: true,
    }),

  refreshToken: () =>
    request("/auth/refresh-token", {
      method: "POST",
      skipRefresh: true,
    }),

  getMe: () => request("/auth/me"),

  getAdminAnalytics: (range = "30d") => request(`/admin/analytics?range=${encodeURIComponent(range)}`),

  getAdminUsers: () => request("/admin/users"),

  updateUserRole: (id: string, data: { role: "USER" | "MANAGER" | "ADMIN"; managerPermissions?: string[] }) =>
    request(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getNotifications: (params?: { unreadOnly?: boolean; limit?: number }) => {
    const query = params ? `?${new URLSearchParams(
      Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {})
    ).toString()}` : "";
    return request(`/notifications${query}`);
  },

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllNotificationsRead: () =>
    request("/notifications/read-all", {
      method: "PATCH",
    }),

  // Products
  getProducts: async (params?: Record<string, string>): Promise<unknown> => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await request<unknown>(`/products${query}`);
    if (response && typeof response === "object" && "data" in response) {
      if (params && (params.page || params.limit)) {
        return response;
      }
      return response.data;
    }
    return response;
  },

  getProduct: (id: string) => request(`/products/${id}`),

  createProduct: (data: unknown) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: unknown) =>
    request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request(`/products/${id}`, {
      method: "DELETE",
    }),

  addProductImage: (productId: string, data: unknown) =>
    request(`/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteProductImage: (productId: string, imageId: string) =>
    request(`/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    }),

  setPrimaryProductImage: (productId: string, imageId: string) =>
    request(`/products/${productId}/images/${imageId}/primary`, {
      method: "PATCH",
    }),


  //shipping 
  getShippingMethods: () => request("/shipping-methods"),

  getAdminShippingMethods: () => request("/shipping-methods/admin"),

  createShippingMethod: (data: unknown) =>
    request("/shipping-methods", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateShippingMethod: (id: string, data: unknown) =>
    request(`/shipping-methods/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),  

  deleteShippingMethod: (id: string) =>
    request(`/shipping-methods/${id}`, {
      method: "DELETE",
    }),  


  // Categories
  getCategories: () => request("/categories"),

  createCategory: (data: unknown) =>
    request("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: unknown) =>
    request(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request(`/categories/${id}`, {
      method: "DELETE",
    }),

  // Cart
  getCart: () => request("/cart"),

  addToCart: (productId: string, quantity: number, selectedColor?: string, productImageId?: string) =>
    request("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, selectedColor, productImageId }),
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    request(`/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),

  removeFromCart: (itemId: string) =>
    request(`/cart/items/${itemId}`, {
      method: "DELETE",
    }),

  clearCart: () =>
    request("/cart", {
      method: "DELETE",
    }),

  // Addresses
  getAddresses: () => request("/addresses"),

  createAddress: (data: unknown) =>
    request("/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAddress: (id: string, data: unknown) =>
    request(`/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAddress: (id: string) =>
    request(`/addresses/${id}`, {
      method: "DELETE",
    }),

  // Orders
  createOrder: (addressId: string, shippingMethodId: string, options?: { idempotencyKey?: string; paymentGateway?: string }) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify({ addressId, shippingMethodId, paymentGateway: options?.paymentGateway }),
      headers: options?.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : undefined,
    }),

  initializePayment: (orderId: string, gateway: string) =>
    request("/payment/initialize", {
      method: "POST",
      body: JSON.stringify({ orderId, gateway }),
    }),

  verifyPaystack: (reference: string) =>
    request("/payment/verify-paystack", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),

  getMyOrders: () => request("/orders/my-orders"),

  getOrders: () => request("/orders"),

  getOrder: (id: string) => request(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  deleteOrder: (id: string) =>
    request(`/orders/${id}`, {
      method: "DELETE",
    }),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    return request("/upload", {
      method: "POST",
      body: formData,
    });
  },
};


export const getAssetUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!API_BASE) return url;

  const apiOrigin = API_BASE.replace(/\/api\/v1$/, "");
  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};
