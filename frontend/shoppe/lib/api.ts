const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

type RequestOptions = RequestInit & {
  skipRefresh?: boolean;
};

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipRefresh, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipRefresh) {
    await request("/auth/refresh-token", {
      method: "POST",
      skipRefresh: true,
    });

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
  getProducts: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    return request(`/products${query}`);
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
  createOrder: (addressId: string) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify({ addressId }),
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
};