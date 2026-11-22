"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  Loading03Icon,
  Location01Icon,
  PackageIcon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS, ORDER_STEPS, getOrderStatus, shortOrderId, type OrderStatus } from "@/lib/order-status";

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

function StatusBadge({ status }: { status: string }) {
  const style = getOrderStatus(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-ink px-2.5 py-1 text-sm font-semibold"
      style={{ background: style.bg, color: style.fg }}
    >
      <HugeiconsIcon icon={style.icon} size={18} strokeWidth={1.8} />
      {style.label}
    </span>
  );
}

const STEP_LABELS: Record<string, string> = {
  PENDING: "Placed",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

function Timeline({ status, createdAt }: { status: string; createdAt: string }) {
  const current = ORDER_STEPS.indexOf(status as OrderStatus);
  if (current < 0) return null;
  return (
    <ol className="grid grid-cols-4" aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => {
        const done = index <= current;
        const isCurrent = index === current;
        const style = ORDER_STATUS[step];
        return (
          <li key={step} className="flex flex-col gap-2.5" aria-current={isCurrent ? "step" : undefined}>
            <div className="flex items-center">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-[1.5px] sm:h-12 sm:w-12 ${
                  done ? "border-ink" : "border-dashed border-gray-400 bg-white text-gray-400"
                }`}
                style={done ? { background: index === 0 ? "#141414" : style.bg, color: index === 0 ? "#FAF7F0" : style.fg } : undefined}
              >
                <HugeiconsIcon icon={index === 0 ? ShoppingCart01Icon : style.icon} size={24} strokeWidth={1.6} />
              </span>
              {index < ORDER_STEPS.length - 1 && (
                <span
                  className={`h-[3px] flex-1 ${index < current ? "bg-ink" : "bg-gray-300"}`}
                  aria-hidden="true"
                />
              )}
            </div>
            <span className="pr-2">
              <span className={`block text-sm font-semibold ${done ? "text-ink" : "text-gray-500"}`}>{STEP_LABELS[step]}</span>
              {index === 0 && (
                <span className="block font-mono text-xs text-gray-600">
                  {new Date(createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const FILTERS: Array<"ALL" | OrderStatus> = ["ALL", "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");

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

  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const visibleOrders = filter === "ALL" ? orders : orders.filter((order) => order.status === filter);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/account" className="mb-4 inline-flex items-center gap-2 text-[15px] font-semibold underline-offset-4 hover:underline">
          <HugeiconsIcon icon={ArrowLeft02Icon} size={22} strokeWidth={1.8} />
          Account
        </Link>
        <h1 className="text-6xl leading-none font-extrabold tracking-[-0.045em] text-ink">My orders</h1>

        {!loading && !loggedOut && orders.length > 0 && (
          <div role="group" aria-label="Filter by status" className="-mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pt-1 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {FILTERS.filter((key) => key === "ALL" || counts[key]).map((key) => {
              const active = filter === key;
              const style = key === "ALL" ? null : ORDER_STATUS[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={active}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-ink px-3.5 text-[15px] font-medium transition ${
                    active ? "bg-ink text-paper" : "bg-white text-ink hover:shadow-sticker-sm"
                  }`}
                >
                  {style && <span className="h-3 w-3 rounded-[3px] border border-ink" style={{ background: style.bg }} aria-hidden="true" />}
                  {key === "ALL" ? "All" : style?.label}
                  <span className="font-mono text-sm opacity-80">{key === "ALL" ? orders.length : counts[key]}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg border-[1.5px] border-gray-300 bg-canvas" />
              ))}
            </div>
          ) : loggedOut ? (
            <div className="flex flex-col items-center rounded-lg border-[1.5px] border-dashed border-ink px-6 py-16 text-center">
              <h2 className="text-3xl font-extrabold text-ink">Log in to see your orders</h2>
              <Link href="/login" className="mt-6 inline-flex h-12 items-center rounded-lg bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black">
                Log in
              </Link>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border-[1.5px] border-dashed border-ink px-6 py-16 text-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-lg border-[1.5px] border-ink bg-blue text-white">
                <HugeiconsIcon icon={PackageIcon} size={52} strokeWidth={1.4} />
              </span>
              <h2 className="mt-5 text-3xl font-extrabold text-ink">No orders yet</h2>
              <p className="mt-2 text-base text-gray-700">When you place an order, you can track it here.</p>
              <Link
                href="/products?sort=newest"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-lg bg-ink px-6 text-[15px] font-semibold text-paper hover:bg-black"
              >
                Shop new in
                <HugeiconsIcon icon={ArrowRight02Icon} size={22} strokeWidth={1.8} />
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {visibleOrders.map((order) => {
                const style = getOrderStatus(order.status);
                return (
                  <li key={order.id} className="overflow-hidden rounded-lg border-[1.5px] border-ink bg-white">
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 border-b-[1.5px] border-ink px-5 py-4"
                      style={{ background: style.soft }}
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold text-ink">
                          {shortOrderId(order.id)} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="mt-0.5 text-lg font-semibold text-ink">
                          {order.orderItems[0]?.product.name}
                          {order.orderItems.length > 1 && (
                            <span className="font-normal text-gray-700"> + {order.orderItems.length - 1} more</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="price-tag text-xl text-ink">{formatPrice(order.total)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                    </div>

                    <div className="px-5">
                      {ORDER_STEPS.includes(order.status as OrderStatus) && (
                        <div className="border-b border-gray-200 py-6">
                          <Timeline status={order.status} createdAt={order.createdAt} />
                        </div>
                      )}
                      {order.status === "CANCELLED" && (
                        <p className="border-b border-gray-200 py-4 text-[15px] text-gray-700">
                          This order was cancelled and its items were returned to stock. If you had already paid, we&apos;ll refund you to your original payment method.
                        </p>
                      )}

                      <ul className="divide-y divide-gray-200">
                        {order.orderItems.map((item) => {
                          const imgUrl = item.product.images?.find((i) => i.id === item.productImageId)?.url || item.product.image;
                          const src = getAssetUrl(imgUrl);
                          return (
                            <li key={item.id} className="flex items-center gap-4 py-4">
                              <Link
                                href={`/products/${item.productId}`}
                                className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md border-[1.5px] border-ink bg-canvas"
                              >
                                {src ? <ProductImage src={src} alt={item.product.name} fill className="object-cover mix-blend-multiply" sizes="56px" /> : null}
                              </Link>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-ink">{item.product.name}</p>
                                <p className="text-sm text-gray-600">
                                  Qty {item.quantity}
                                  {item.selectedColor ? <span className="capitalize"> · {item.selectedColor}</span> : ""}
                                </p>
                              </div>
                              <p className="font-mono font-semibold text-ink">{formatPrice(Number(item.price) * item.quantity)}</p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-4 border-t-[1.5px] border-ink px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-[15px] text-gray-700">
                        <HugeiconsIcon icon={Location01Icon} size={20} strokeWidth={1.6} className="shrink-0" />
                        {order.shippingName}, {order.shippingCity}, {order.shippingState}
                      </p>
                      {order.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => handleCompletePayment(order.id)}
                          disabled={payingOrderId === order.id}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-[15px] font-semibold text-paper transition hover:bg-black disabled:opacity-60"
                        >
                          {payingOrderId === order.id && <HugeiconsIcon icon={Loading03Icon} size={20} className="animate-spin" />}
                          Complete payment
                        </button>
                      ) : order.status !== "CANCELLED" ? (
                        <Link
                          href={`/checkout/success?orderId=${order.id}`}
                          className="inline-flex h-12 items-center justify-center rounded-lg border-[1.5px] border-ink px-5 text-[15px] font-semibold transition hover:bg-sun"
                        >
                          Receipt
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
