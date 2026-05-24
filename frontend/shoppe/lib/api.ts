const DEFAULT_API_BASE = process.env.VERCEL
  ? "https://shoppe-backend-yko6.onrender.com/api/v1"
  : "http://localhost:5000/api/v1";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE;

type RequestOptions = RequestInit & {
  skipRefresh?: boolean;
};

let refreshPromise: Promise<unknown> | null = null;

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipRefresh, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipRefresh) {
    if (!refreshPromise) {
      refreshPromise = request("/auth/refresh-token", {
        method: "POST",
        skipRefresh: true,
      }).finally(() => {
        refreshPromise = null;
      });
    }

    await refreshPromise;

    return request<T>(endpoint, {
      ...options,
      skipRefresh: true,
    });
  }


  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));

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

  addToCart: (productId: string, quantity: number) =>
    request("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
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

  const apiOrigin = API_BASE.replace(/\/api\/v1$/, "");
  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
};
