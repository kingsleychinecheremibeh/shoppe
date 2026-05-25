"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Calendar,
  Loader2,
  Package,
  ChevronRight,
  XCircle,
  HelpCircle,
  FileText,
  Truck,
  CheckCircle2
} from "lucide-react";
import { ProductImage } from "@/app/components/product-image";
import { api, getAssetUrl } from "@/lib/api";
import { toast } from "sonner";

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image: string;
  };
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  paymentGateway: string;
  paymentReference: string | null;
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  orderItems: OrderItem[];
};

type UserData = {
  name: string;
  email: string;
};

type MeResponse = {
  user: UserData;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NGN",
});

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        const [ordersData, userData] = await Promise.all([
          api.getMyOrders(),
          api.getMe(),
        ]);
        setOrders((ordersData as Order[]) || []);
        setUser((userData as MeResponse).user);
      } catch {
        toast.error("Please login to view your order history.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersData();
  }, []);

  const getStatusBadge = (status: string | null | undefined) => {
    const s = (status || "PENDING").toUpperCase();
    let bg = "bg-gray-50 text-gray-700 border-gray-200";
    let icon = <HelpCircle className="h-4 w-4 mr-1.5" />;

    if (s === "PENDING") {
      bg = "bg-amber-50 text-amber-700 border-amber-200";
      icon = <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />;
    } else if (s === "PAID") {
      bg = "bg-emerald-50 text-emerald-700 border-emerald-200";
      icon = <CheckCircle2 className="h-4 w-4 mr-1.5" />;
    } else if (s === "SHIPPED") {
      bg = "bg-indigo-50 text-indigo-700 border-indigo-200";
      icon = <Truck className="h-4 w-4 mr-1.5" />;
    } else if (s === "DELIVERED") {
      bg = "bg-teal-50 text-teal-700 border-teal-200";
      icon = <Package className="h-4 w-4 mr-1.5" />;
    } else if (s === "CANCELLED") {
      bg = "bg-rose-50 text-rose-700 border-rose-200";
      icon = <XCircle className="h-4 w-4 mr-1.5" />;
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${bg}`}>
        {icon}
        {s}
      </span>
    );
  };

  const getGatewayBadge = (gateway: string | null | undefined) => {
    if (!gateway) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
          Unspecified
        </span>
      );
    }
    const g = gateway.toUpperCase();
    if (g === "PAYSTACK") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-150">
          Paystack 🇳🇬
        </span>
      );
    } else if (g === "STRIPE") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-150">
          Stripe 🌐
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-50 text-gray-600 border border-gray-200">
        {gateway}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50/50">
        <Loader2 className="h-10 w-10 text-black animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Loading your order history...</p>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-gray-100 mb-10">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-black transition">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/account" className="hover:text-black transition">Account</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-800 font-medium">Orders</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Order History
          </h1>
        </div>

        {user && (
          <div className="flex items-center mt-4 md:mt-0 px-4 py-2.5 bg-gray-50 border border-gray-150 rounded-xl space-x-3">
            <div className="h-9 w-9 bg-black rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {(user?.name || "User").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Account Owner</p>
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            </div>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <div className="mx-auto h-16 w-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders placed yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
            Your shopping history is currently empty. Explore our unique collections and place your first order!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-black hover:bg-neutral-800 transition shadow-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        /* Orders List */
        <div className="space-y-8">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Order Header Summary */}
              <div className="bg-gray-50/75 border-b border-gray-100 px-6 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Order Placed
                  </p>
                  <p className="text-sm font-medium text-gray-800 flex items-center">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Order ID
                  </p>
                  <p className="text-sm font-mono font-medium text-gray-700 uppercase">
                    #{order.id.slice(0, 8)}...
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Payment Gateway
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    {getGatewayBadge(order.paymentGateway)}
                    {order.paymentReference && (
                      <span className="text-[10px] font-mono text-gray-400">
                        ({order.paymentReference.slice(0, 6)}...)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center sm:justify-end">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Order Products List */}
              <div className="divide-y divide-gray-100 px-6">
                {order.orderItems.map((item) => (
                  <div key={item.id} className="py-5 flex items-center space-x-4">
                    <div className="h-20 w-16 relative shrink-0 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                      <ProductImage
                        src={getAssetUrl(item.product.image) || "https://images.pexels.com/photos/1036856/pexels-photo-1036856.jpeg"}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate mb-1">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {currencyFormatter.format(Number(item.price) * item.quantity)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {currencyFormatter.format(Number(item.price))} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Shipping and Total Footer */}
              <div className="bg-gray-50/30 border-t border-gray-100 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">Delivering to:</span>{" "}
                  {order.shippingName} — {order.shippingStreet}, {order.shippingCity},{" "}
                  {order.shippingState}, {order.shippingCountry}
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:space-x-8">
                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                      Amount Paid
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {currencyFormatter.format(Number(order.total))}
                    </span>
                  </div>

                  <Link
                    href={`/checkout/success?orderId=${order.id}`}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 hover:border-black rounded-xl text-xs font-semibold text-gray-700 hover:text-black transition shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    View Invoice
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
