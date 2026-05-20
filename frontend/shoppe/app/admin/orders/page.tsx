"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Eye, ImageIcon, Search, X } from "lucide-react";
import { toast } from "sonner";
import { api, getAssetUrl } from "@/lib/api";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type MeResponse = {
  user: UserData;
};

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type Product = {
  id: string;
  name: string;
  image?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number | string;
  product?: Product | null;
};

type Address = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
};

type Order = {
  id: string;
  total: number | string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  orderItems?: OrderItem[];
  address?: Address | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const getNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error.message;
  return fallback;
};

const formatStatus = (status: string) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const getStatusClassName = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-orange-100 text-orange-800";
    case "PAID":
      return "bg-blue-100 text-blue-800";
    case "SHIPPED":
      return "bg-purple-100 text-purple-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const me = (await api.getMe()) as MeResponse;

      if (me.user.role !== "ADMIN") {
        toast.error("You need an admin account to manage orders.");
        window.location.assign("/");
        return;
      }

      const data = await api.getOrders();
      setOrders((data as Order[]) || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch orders."));
      window.location.assign("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchOrders);
  }, []);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return orders;

    return orders.filter((order) => {
      return (
        order.id.toLowerCase().includes(search) ||
        order.user?.email?.toLowerCase().includes(search) ||
        order.user?.name?.toLowerCase().includes(search) ||
        order.status.toLowerCase().includes(search)
      );
    });
  }, [orders, query]);

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    if (newStatus === order.status) return;

    setUpdatingOrderId(order.id);

    try {
      const updatedOrder = (await api.updateOrderStatus(order.id, newStatus)) as Order;
      toast.success("Order status updated.");

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, ...updatedOrder, user: item.user } : item
        )
      );

      setSelectedOrder((current) => {
        if (!current || current.id !== order.id) return current;
        return { ...current, ...updatedOrder, user: current.user };
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update order status."));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-gray-100 pb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Flow Desk</span>
            <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">Store Purchases</h1>
            <p className="mt-2 text-xs font-medium text-gray-500 max-w-lg leading-relaxed">
              Monitor active checkout orders, trace full client shipping structures, and transition logistics delivery stages.
            </p>
          </div>

          <label className="relative block lg:w-96">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, customer name, email..."
              className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-xs font-medium text-gray-950 outline-none transition duration-300 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/5"
            />
          </label>
        </div>

        {/* Table List Layout */}
        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead align="right">Actions</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-950">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-xs font-bold text-gray-900">
                              {order.user?.name || "N/A"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {order.user?.email || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {dateFormatter.format(new Date(order.createdAt))}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-gray-950">
                          {currencyFormatter.format(getNumber(order.total))}
                        </td>
                        <td className="px-6 py-4">
                          <OrderStatusControl
                            order={order}
                            disabled={updatingOrderId === order.id}
                            onChange={handleUpdateStatus}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 border border-gray-100 hover:bg-gray-100 hover:text-gray-950 transition"
                              aria-label={`View order ${order.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {query ? "No orders match your search." : "No orders yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          updating={updatingOrderId === selectedOrder.id}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleUpdateStatus}
        />
      )}
    </main>
  );
}

function OrderStatusControl({
  order,
  disabled,
  onChange,
}: {
  order: Order;
  disabled: boolean;
  onChange: (order: Order, status: OrderStatus) => void;
}) {
  const nextStatuses = statusTransitions[order.status];
  const isFinal = nextStatuses.length === 0;

  if (isFinal) {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(
          order.status
        )}`}
      >
        {formatStatus(order.status)}
      </span>
    );
  }

  return (
    <select
      value={order.status}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
        onChange(order, event.target.value as OrderStatus)
      }
      className={`h-8 rounded-full border border-gray-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wider outline-none transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${getStatusClassName(
        order.status
      )}`}
    >
      <option value={order.status}>{formatStatus(order.status)}</option>
      {nextStatuses.map((status) => (
        <option key={status} value={status}>
          {formatStatus(status)}
        </option>
      ))}
    </select>
  );
}

function OrderDetailsModal({
  order,
  updating,
  onClose,
  onStatusChange,
}: {
  order: Order;
  updating: boolean;
  onClose: () => void;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}) {
  const subtotal =
    order.orderItems?.reduce((sum, item) => {
      return sum + item.quantity * getNumber(item.price);
    }, 0) ?? getNumber(order.total);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl border border-gray-200 py-1">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-serif font-black tracking-tight text-gray-950">Fulfillment Details</h2>
            <p className="mt-1.5 text-[10px] text-gray-400 font-mono">ORDER ID: #{order.id.toUpperCase()}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-950"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 bg-gray-50/50 border border-gray-200 rounded-xl p-5">
            <InfoBlock label="Date & Time Placed">
              {dateTimeFormatter.format(new Date(order.createdAt))}
            </InfoBlock>
            <InfoBlock label="Fulfillment Stage">
              <div className="mt-1"><OrderStatusControl order={order} disabled={updating} onChange={onStatusChange} /></div>
            </InfoBlock>
            <InfoBlock label="Registered Account">
              <span className="block text-xs font-bold text-gray-950">{order.user?.name || "N/A"}</span>
              <span className="block text-[10px] text-gray-400 font-medium mt-0.5">{order.user?.email || "N/A"}</span>
            </InfoBlock>
            <InfoBlock label="Total">
              {currencyFormatter.format(getNumber(order.total))}
            </InfoBlock>
          </div>

          <section>
            <h3 className="mb-3 font-semibold text-gray-950">Order Items</h3>
            <div className="space-y-3">
              {order.orderItems?.length ? (
                order.orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg bg-gray-50 p-3"
                  >
                    <ItemThumbnail item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-950">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} x {currencyFormatter.format(getNumber(item.price))}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-gray-950">
                      {currencyFormatter.format(item.quantity * getNumber(item.price))}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs font-semibold text-gray-400">
                  No items listed inside order register records.
                </p>
              )}
            </div>
          </section>

          {order.address && (
            <section>
              <h3 className="mb-3 text-xs font-bold text-gray-700 uppercase tracking-wide">Shipping Address</h3>
              <div className="rounded-xl border border-gray-200 bg-gray-50/20 p-4">
                <p className="text-xs font-bold text-gray-900">{order.address.fullName}</p>
                <p className="mt-1.5 text-xs text-gray-600 leading-relaxed font-medium">
                  {order.address.street}
                  <br />
                  {order.address.city}, {order.address.state}
                  <br />
                  {order.address.country}
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-500 border-t border-gray-100 pt-2">Phone linkage: {order.address.phone}</p>
              </div>
            </section>
          )}

          <section className="border-t border-gray-100 pt-4.5">
            <div className="space-y-2 max-w-xs ml-auto">
              <SummaryRow label="Items Subtotal" value={subtotal} />
              <SummaryRow label="Global Standard Shipping" value={0} />
              <SummaryRow label="Regional Taxes" value={0} />
              <div className="flex justify-between border-t border-gray-100 pt-3 text-sm font-black text-gray-950">
                <span>Total</span>
                <span>{currencyFormatter.format(getNumber(order.total))}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-6 py-3 text-xs font-semibold uppercase text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <div className="mt-1 font-semibold text-gray-950">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs font-medium">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-950">{currencyFormatter.format(value)}</span>
    </div>
  );
}

function ItemThumbnail({ item }: { item: OrderItem }) {
  const image = getAssetUrl(item.product?.image);

  if (!image) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-400">
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div
      className="h-12 w-12 shrink-0 rounded-lg bg-gray-50 bg-cover bg-center border border-gray-200"
      style={{ backgroundImage: `url("${image}")` }}
      aria-label={item.product?.name || "Product image"}
    />
  );
}
