"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  selectedColor?: string | null;
  productImageId?: string | null;
  product: {
    name: string;
    image: string;
    images?: { id: string; url: string }[];
  };
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  orderItems: OrderItem[];
};

type PaymentInitializeResponse = {
  data?: { authorizationUrl?: string };
};

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Awaiting payment", className: "bg-brand-soft text-brand" },
  PAID: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
  SHIPPED: { label: "On its way", className: "bg-sky-50 text-sky-700" },
  DELIVERED: { label: "Delivered", className: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
};

const STEPS = ["PAID", "SHIPPED", "DELIVERED"];

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { label: status, className: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

function Progress({ status }: { status: string }) {
  const current = STEPS.indexOf(status);
  if (current < 0) return null;
  return (
    <ol className="flex items-center gap-2 text-xs text-gray-500" aria-label="Order progress">
      {STEPS.map((step, index) => (
        <li key={step} className="flex flex-1 items-center gap-2">
          <span
            className={`h-1.5 flex-1 rounded-full ${index <= current ? "bg-emerald-500" : "bg-gray-200"}`}
            aria-hidden="true"
          />
          <span className={index <= current ? "text-gray-900" : ""}>{STATUS_STYLES[step].label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await api.getMyOrders();
        setOrders((ordersData as Order[]) || []);
      } catch {
        setLoggedOut(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const handleCompletePayment = async (orderId: string) => {
    try {
      setPayingOrderId(orderId);
      const payment = (await api.initializePayment(orderId, "PAYSTACK")) as PaymentInitializeResponse;
      const url = payment.data?.authorizationUrl;
      if (!url) throw new Error("No payment link returned");
      window.location.assign(url);
    } catch {
      toast.error("We couldn't start the payment. Please try again or contact us.");
      setPayingOrderId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Account
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">My orders</h1>

        <div className="mt-8">
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          ) : loggedOut ? (
            <div className="rounded-3xl bg-canvas px-6 py-16 text-center">
              <h2 className="text-lg font-semibold text-gray-950">Log in to see your orders</h2>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
              >
                Log in
              </Link>
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl bg-canvas px-6 py-16 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-gray-300" />
              <h2 className="mt-4 text-lg font-semibold text-gray-950">No orders yet</h2>
              <p className="mt-1 text-sm text-gray-500">When you place an order, you can track it here.</p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-hover"
              >
                Start shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {orders.map((order) => (
                <li key={order.id} className="overflow-hidden rounded-2xl border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas px-5 py-4">
                    <div className="text-sm">
                      <p className="font-medium text-gray-950">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="font-mono text-xs text-gray-500">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="px-5">
                    {STEPS.includes(order.status) && (
                      <div className="border-b border-gray-100 py-4">
                        <Progress status={order.status} />
                      </div>
                    )}

                    <ul className="divide-y divide-gray-100">
                      {order.orderItems.map((item) => {
                        const imgUrl =
                          item.product.images?.find((i) => i.id === item.productImageId)?.url || item.product.image;
                        const src = getAssetUrl(imgUrl);
                        return (
                          <li key={item.id} className="flex items-center gap-4 py-4">
                            <Link
                              href={`/products/${item.productId}`}
                              className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-canvas"
                            >
                              {src ? (
                                <ProductImage src={src} alt={item.product.name} fill className="object-cover" sizes="56px" />
                              ) : null}
                            </Link>
                            <div className="min-w-0 flex-1 text-sm">
                              <p className="truncate font-medium text-gray-900">{item.product.name}</p>
                              <p className="text-gray-500">
                                Qty {item.quantity}
                                {item.selectedColor ? ` · ${item.selectedColor}` : ""}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-950">
                              {formatPrice(Number(item.price) * item.quantity)}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">
                      To {order.shippingName}, {order.shippingCity}, {order.shippingState}
                    </p>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <p className="text-sm">
                        <span className="text-gray-500">Total </span>
                        <span className="font-semibold text-gray-950">{formatPrice(order.total)}</span>
                      </p>
                      {order.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => handleCompletePayment(order.id)}
                          disabled={payingOrderId === order.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
                        >
                          {payingOrderId === order.id && <Loader2 className="h-4 w-4 animate-spin" />}
                          Complete payment
                        </button>
                      ) : order.status !== "CANCELLED" ? (
                        <Link
                          href={`/checkout/success?orderId=${order.id}`}
                          className="text-sm font-medium text-gray-600 underline-offset-4 transition hover:text-gray-950 hover:underline"
                        >
                          Receipt
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
