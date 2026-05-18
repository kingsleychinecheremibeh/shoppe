"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type Product = {
  id: string;
  name: string;
  stock: number;
  price: number | string;
  category?: {
    name: string;
  } | null;
};

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

type Order = {
  id: string;
  total: number | string;
  status: OrderStatus;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type MeResponse = {
  user: UserData;
};

type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStockProducts: number;
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

const getNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unable to load the admin dashboard.";
};

const getStatusClassName = (status: OrderStatus) => {
  switch (status) {
    case "DELIVERED":
      return "bg-green-50 text-green-700 border border-green-200/50";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200/50";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 border border-rose-200/50";
    case "PAID":
      return "bg-sky-50 text-sky-700 border border-sky-200/50";
    case "SHIPPED":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200/50";
    default:
      return "bg-gray-50 text-gray-700 border border-gray-200/50";
  }
};

const formatStatus = (status: string) => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        const me = (await api.getMe()) as MeResponse;

        if (me.user.role !== "ADMIN") {
          toast.error("You need an admin account to view the dashboard.");
          router.replace("/");
          return;
        }

        const [productsData, ordersData] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
        ]);

        if (ignore) return;

        setUser(me.user);
        setProducts((productsData as Product[]) || []);
        setOrders((ordersData as Order[]) || []);
      } catch (error) {
        if (ignore) return;

        toast.error(getErrorMessage(error));
        router.replace("/login");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [router]);

  const stats = useMemo<DashboardStats>(() => {
    const uniqueCustomers = new Set(
      orders.map((order) => order.user?.id).filter(Boolean)
    );

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalCustomers: uniqueCustomers.size,
      totalRevenue: orders.reduce((sum, order) => sum + getNumber(order.total), 0),
      pendingOrders: orders.filter((order) => order.status === "PENDING").length,
      lowStockProducts: products.filter((product) => product.stock < 10).length,
    };
  }, [orders, products]);

  const recentOrders = orders.slice(0, 5);
  const lowStockProducts = products
    .filter((product) => product.stock < 10)
    .sort((first, second) => first.stock - second.stock)
    .slice(0, 4);

  if (loading) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50/50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Top Title */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-100 pb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Welcome back{user ? `, ${user.name}` : ""}
            </span>
            <h1 className="mt-1.5 text-4xl font-serif font-black tracking-tight text-gray-950">
              Dashboard Overview
            </h1>
            <p className="mt-2 text-xs font-medium text-gray-550 max-w-lg leading-relaxed">
              Track active catalog items, live order fulfillments, sales projections, and low-level item stock metrics.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-xs font-semibold text-white hover:bg-gray-800 transition shadow-xs uppercase tracking-wider"
          >
            View Live Store
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Dashboard Grid Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Products"
            value={stats.totalProducts.toLocaleString()}
            icon={Package}
            tone="blue"
            helper="Active catalog items"
          />
          <StatCard
            label="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingBag}
            tone="green"
            helper={`${stats.pendingOrders} pending items`}
          />
          <StatCard
            label="Customers"
            value={stats.totalCustomers.toLocaleString()}
            icon={Users}
            tone="purple"
            helper="Registered customer accounts"
          />
          <StatCard
            label="Total Revenue"
            value={currencyFormatter.format(stats.totalRevenue)}
            icon={DollarSign}
            tone="yellow"
            helper="All-time storefront value"
          />
        </div>

        {/* Custom Alerts */}
        {stats.lowStockProducts > 0 && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Low Stock Inventory Alert</p>
                <p className="mt-1 text-xs font-medium text-amber-700 leading-relaxed">
                  There are currently {stats.lowStockProducts} products with less than 10 stock items remaining. Action is recommended to restock.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Multi Column Layout */}
        <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_360px]">
          
          {/* Recent Orders Section */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
            <div className="border-b border-gray-100 p-6">
              <h2 className="text-lg font-serif font-black tracking-tight text-gray-950">Recent Purchases</h2>
              <p className="mt-1 text-xs text-gray-500 font-medium">
                Latest customer placements recorded from your storefront checkout routes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-180">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Fulfillment Status</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length ? (
                    recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-gray-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-950">
                            {order.user?.name || "N/A"}
                          </div>
                          {order.user?.email && (
                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">{order.user.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {dateFormatter.format(new Date(order.createdAt))}
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-gray-950">
                          {currencyFormatter.format(getNumber(order.total))}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusClassName(
                              order.status
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-gray-400">
                        No orders recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Stock Watch Sidebar */}
          <aside className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs h-fit">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-serif font-black tracking-tight text-gray-950">Stock Watch</h2>
                <p className="mt-1 text-[10px] text-gray-400 font-medium">Critical levels requiring attention.</p>
              </div>
              <TrendingUp className="h-4.5 w-4.5 text-gray-400" />
            </div>

            <div className="space-y-3.5">
              {lowStockProducts.length ? (
                lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3.5 bg-gray-50/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-gray-950">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {product.category?.name || "Uncategorized"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-50 border border-amber-200/50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
                      {product.stock} units left
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                  <p className="text-xs font-semibold text-gray-500">All levels look healthy</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">Products have sufficient inventory.</p>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">
      {children}
    </th>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: typeof Package;
  tone: "blue" | "green" | "purple" | "yellow";
};

const statTones: Record<StatCardProps["tone"], string> = {
  blue: "bg-sky-50 text-sky-700 border-sky-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  purple: "bg-indigo-50 text-indigo-700 border-indigo-100",
  yellow: "bg-amber-50 text-amber-700 border-amber-100",
};

function StatCard({ label, value, helper, icon: Icon, tone }: StatCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg border ${statTones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
      <p className="text-2xl font-serif font-black tracking-tight text-gray-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</p>
      <p className="mt-3.5 text-[10px] text-gray-400 font-medium border-t border-gray-100/50 pt-2">{helper}</p>
    </section>
  );
}
