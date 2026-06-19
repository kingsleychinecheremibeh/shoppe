"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Camera,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  PackageX,
  ReceiptText,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type UserData = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MANAGER" | "ADMIN";
  managerPermissions?: string[];
};

type MeResponse = {
  user: UserData;
};

type RangeOption = "7d" | "30d" | "90d" | "all";

type RevenuePoint = {
  date: string;
  revenue: number;
  orders: number;
  aov: number;
};

type NamedRevenue = {
  name: string;
  revenue: number;
};

type ProductMetric = {
  id: string;
  name: string;
  category: string;
  stock: number;
  units: number;
  revenue: number;
};

type InventoryProduct = {
  id: string;
  name: string;
  category: string;
  stock: number;
  units?: number;
};

type StatusMetric = {
  status: string;
  count: number;
};

type MediaProduct = {
  id: string;
  name: string;
  category: string;
  hasLegacyImage: boolean;
  galleryCount: number;
  colorTaggedCount: number;
  hasPrimaryImage: boolean;
};

type AgingOrder = {
  id: string;
  customer: string;
  total: number;
  ageDays: number;
};

type TopCustomer = {
  id: string;
  name: string;
  email: string;
  spend: number;
  orders: number;
};

type Analytics = {
  range: RangeOption;
  summary: {
    grossRevenue: number;
    paidOrders: number;
    unitsSold: number;
    averageOrderValue: number;
    stockAlerts: number;
    cancelRate: number;
    revenueChange: number;
  };
  revenue: {
    trend: RevenuePoint[];
    byCategory: NamedRevenue[];
    byPaymentGateway: NamedRevenue[];
  };
  products: {
    bestByUnits: ProductMetric[];
    bestByRevenue: ProductMetric[];
    leastSold: ProductMetric[];
    stockWithZeroSales: ProductMetric[];
  };
  inventory: {
    lowStock: InventoryProduct[];
    outOfStock: InventoryProduct[];
    stockValue: number;
    fastMoving: InventoryProduct[];
    slowMoving: ProductMetric[];
  };
  fulfillment: {
    statusCounts: StatusMetric[];
    pendingOrders: number;
    paidNotShipped: number;
    shipped: number;
    delivered: number;
    agingPaidOrders: AgingOrder[];
  };
  customers: {
    topCustomers: TopCustomer[];
    repeatPurchaseRate: number;
    averageOrderCount: number;
  };
  media: {
    summary: {
      noImage: number;
      onlyLegacyImage: number;
      withGallery: number;
      withColorTaggedGallery: number;
      noPrimaryGalleryImage: number;
    };
    needsWork: MediaProduct[];
  };
};

const rangeOptions: Array<{ label: string; value: RangeOption }> = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "All", value: "all" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const statusColors: Record<string, string> = {
  PENDING: "#d97706",
  PAID: "#0284c7",
  SHIPPED: "#7c3aed",
  DELIVERED: "#059669",
  CANCELLED: "#dc2626",
};

const getNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unable to load the admin dashboard.";
};

const formatCurrency = (value: number) => currencyFormatter.format(getNumber(value));
const formatNumber = (value: number) => getNumber(value).toLocaleString();
const formatCompactCurrency = (value: number) => `₦${compactNumberFormatter.format(getNumber(value))}`;

const formatStatus = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

const getManagerLandingPath = (permissions: string[] = []) => {
  if (permissions.includes("ANALYTICS")) return "/admin";
  if (permissions.includes("ORDER_MANAGEMENT")) return "/admin/orders";
  if (permissions.includes("PRODUCT_MANAGEMENT")) return "/admin/products";
  if (permissions.includes("SHIPPING_MANAGEMENT")) return "/admin/shipping";
  return "/";
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [range, setRange] = useState<RangeOption>("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const me = (await api.getMe()) as MeResponse;

        const canViewAnalytics =
          me.user.role === "ADMIN" || me.user.managerPermissions?.includes("ANALYTICS");

        if (!canViewAnalytics) {
          const landingPath = getManagerLandingPath(me.user.managerPermissions);
          if (landingPath !== "/") {
            router.replace(landingPath);
          } else {
            toast.error("You do not have access to the admin dashboard.");
            router.replace("/");
          }
          return;
        }

        const dashboardData = (await api.getAdminAnalytics(range)) as Analytics;

        if (ignore) return;

        setUser(me.user);
        setAnalytics(dashboardData);
      } catch (error) {
        if (ignore) return;

        toast.error(getErrorMessage(error));
        router.replace("/login");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, [range, router]);

  const statusTotal = useMemo(() => {
    return analytics?.fulfillment.statusCounts.reduce((sum, item) => sum + item.count, 0) ?? 0;
  }, [analytics]);

  if (loading && !analytics) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-950" />
      </main>
    );
  }

  if (!analytics) return null;

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Admin dashboard{user ? `, ${user.name}` : ""}
            </span>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
              Store Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600">
              See sales, orders, stock, customers, and product images in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`h-8 rounded-md px-3 text-xs font-bold transition ${
                    range === option.value
                      ? "bg-gray-950 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
            >
              Orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            label="Total Sales"
            value={formatCurrency(analytics.summary.grossRevenue)}
            helper={`${percentFormatter.format(analytics.summary.revenueChange)}% compared with the last period`}
            icon={CircleDollarSign}
            tone="emerald"
          />
          <KpiCard
            label="Paid Orders"
            value={formatNumber(analytics.summary.paidOrders)}
            helper={`${analytics.fulfillment.paidNotShipped} paid orders still need shipping`}
            icon={ReceiptText}
            tone="sky"
          />
          <KpiCard
            label="Units Sold"
            value={formatNumber(analytics.summary.unitsSold)}
            helper="Items customers paid for"
            icon={ShoppingBag}
            tone="violet"
          />
          <KpiCard
            label="Average Order Value"
            value={formatCurrency(analytics.summary.averageOrderValue)}
            helper="Average amount spent per paid order"
            icon={BadgeDollarSign}
            tone="amber"
          />
          <KpiCard
            label="Stock Warnings"
            value={formatNumber(analytics.summary.stockAlerts)}
            helper="Products that are low or out of stock"
            icon={AlertTriangle}
            tone="rose"
          />
          <KpiCard
            label="Cancelled Orders"
            value={`${percentFormatter.format(analytics.summary.cancelRate)}%`}
            helper="Percent of orders that were cancelled"
            icon={TrendingDown}
            tone="slate"
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <Panel
            title="Daily Sales"
            description="Shows how much money came in each day during the selected time period."
            action={<MetricPill label="Value of stock" value={formatCurrency(analytics.inventory.stockValue)} />}
          >
            <LineChart
              data={analytics.revenue.trend}
              valueKey="revenue"
              secondaryKey="aov"
              height={280}
              formatValue={formatCompactCurrency}
            />
          </Panel>

          <Panel title="Order Status" description="Shows where orders are in the delivery process.">
            <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
              <DonutChart data={analytics.fulfillment.statusCounts} total={statusTotal} />
              <div className="space-y-3">
                {analytics.fulfillment.statusCounts.map((item) => (
                  <div key={item.status} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: statusColors[item.status] || "#6b7280" }}
                      />
                      <span className="text-xs font-bold text-gray-700">{formatStatus(item.status)}</span>
                    </div>
                    <span className="text-sm font-black text-gray-950">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniMetric label="Pending" value={analytics.fulfillment.pendingOrders} icon={Clock3} />
              <MiniMetric label="Paid but not shipped" value={analytics.fulfillment.paidNotShipped} icon={Truck} />
              <MiniMetric label="Shipped" value={analytics.fulfillment.shipped} icon={PackageCheck} />
              <MiniMetric label="Delivered" value={analytics.fulfillment.delivered} icon={PackageCheck} />
            </div>
          </Panel>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title="Best Products by Sales" description="Products that made the most money from paid orders.">
            <BarList
              data={analytics.products.bestByRevenue}
              valueKey="revenue"
              formatValue={formatCurrency}
              emptyText="No paid product sales yet."
            />
          </Panel>

          <Panel title="Most Sold Products" description="Products with the highest number of items sold.">
            <BarList
              data={analytics.products.bestByUnits}
              valueKey="units"
              formatValue={(value) => `${formatNumber(value)} units`}
              emptyText="No products have been sold yet."
            />
          </Panel>

          <Panel title="Slow Selling Products" description="Products with the fewest sales in this time period.">
            <BarList
              data={analytics.products.leastSold}
              valueKey="units"
              reverse
              formatValue={(value) => `${formatNumber(value)} units`}
              emptyText="No slow selling products yet."
            />
          </Panel>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel
            title="Stock Problems"
            description="Products that need attention because stock is low, empty, or not selling."
            action={<MetricPill label="Out of stock" value={formatNumber(analytics.inventory.outOfStock.length)} />}
          >
            <DataTable
              columns={["Product", "Category", "Stock"]}
              rows={analytics.inventory.lowStock.map((product) => [
                product.name,
                product.category,
                `${product.stock} left`,
              ])}
              emptyText="No low stock products."
            />
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <InsightList
                title="Selling fast"
                icon={TrendingUp}
                items={analytics.inventory.fastMoving.map((product) => ({
                  label: product.name,
                  helper: `${product.units || 0} sold, ${product.stock} in stock`,
                }))}
                emptyText="No fast-selling products are running low."
              />
              <InsightList
                title="In stock but not selling"
                icon={Boxes}
                items={analytics.products.stockWithZeroSales.map((product) => ({
                  label: product.name,
                  helper: `${product.stock} units available`,
                }))}
                emptyText="No products are sitting in stock without sales."
              />
            </div>
          </Panel>

          <Panel title="Product Pictures" description="Shows which products need better images or color photos.">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <MediaMetric label="No image" value={analytics.media.summary.noImage} />
              <MediaMetric label="Only old image" value={analytics.media.summary.onlyLegacyImage} />
              <MediaMetric label="Has extra images" value={analytics.media.summary.withGallery} />
              <MediaMetric label="Has color photos" value={analytics.media.summary.withColorTaggedGallery} />
              <MediaMetric label="No main image" value={analytics.media.summary.noPrimaryGalleryImage} />
            </div>
            <DataTable
              className="mt-5"
              columns={["Product", "Extra images", "Color photos", "Main image"]}
              rows={analytics.media.needsWork.map((product) => [
                product.name,
                String(product.galleryCount),
                String(product.colorTaggedCount),
                product.hasPrimaryImage ? "Yes" : "No",
              ])}
              emptyText="All product pictures look ready."
            />
          </Panel>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Panel title="Sales by Category" description="Shows how much money each product category made.">
            <HorizontalBarChart data={analytics.revenue.byCategory} formatValue={formatCurrency} />
          </Panel>

          <Panel title="Customer Spending" description="Shows repeat customers and customers who spent the most.">
            <div className="grid grid-cols-2 gap-3">
              <MiniMetric label="Repeat customers" value={`${percentFormatter.format(analytics.customers.repeatPurchaseRate)}%`} icon={Users} />
              <MiniMetric label="Average orders" value={analytics.customers.averageOrderCount.toFixed(1)} icon={ReceiptText} />
            </div>
            <DataTable
              className="mt-5"
              columns={["Customer", "Orders", "Total spent"]}
              rows={analytics.customers.topCustomers.map((customer) => [
                customer.name || customer.email,
                String(customer.orders),
                formatCurrency(customer.spend),
              ])}
              emptyText="No customers have paid for orders yet."
            />
          </Panel>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1fr]">
          <Panel title="Sales by Payment Method" description="Shows how much money came through each payment method.">
            <HorizontalBarChart data={analytics.revenue.byPaymentGateway} formatValue={formatCurrency} />
          </Panel>

          <Panel title="Paid Orders Waiting Too Long" description="Paid orders older than 3 days that have not been shipped.">
            <DataTable
              columns={["Order", "Customer", "Age", "Total"]}
              rows={analytics.fulfillment.agingPaidOrders.map((order) => [
                `#${order.id.slice(0, 8).toUpperCase()}`,
                order.customer,
                `${order.ageDays} days`,
                formatCurrency(order.total),
              ])}
              emptyText="No paid orders are waiting too long."
            />
          </Panel>
        </section>
      </div>
    </main>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: typeof ShoppingBag;
  tone: "emerald" | "sky" | "violet" | "amber" | "rose" | "slate";
};

const kpiToneClasses: Record<KpiCardProps["tone"], string> = {
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  sky: "border-sky-100 bg-sky-50 text-sky-700",
  violet: "border-violet-100 bg-violet-50 text-violet-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

function KpiCard({ label, value, helper, icon: Icon, tone }: KpiCardProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs xl:col-span-1">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${kpiToneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-500" />
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-gray-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-3 border-t border-gray-100 pt-2 text-[10px] font-medium text-gray-600">{helper}</p>
    </section>
  );
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
      <div className="mb-5 flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black tracking-tight text-gray-950">{title}</h2>
          <p className="mt-1 text-xs font-medium text-gray-600">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-sm font-black text-gray-950">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof ShoppingBag }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <p className="mt-2 text-lg font-black text-gray-950">{value}</p>
    </div>
  );
}

function MediaMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <Camera className="mb-2 h-4 w-4 text-gray-500" />
      <p className="text-lg font-black text-gray-950">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
    </div>
  );
}

function LineChart({
  data,
  valueKey,
  secondaryKey,
  height,
  formatValue,
}: {
  data: RevenuePoint[];
  valueKey: keyof RevenuePoint;
  secondaryKey: keyof RevenuePoint;
  height: number;
  formatValue: (value: number) => string;
}) {
  const width = 900;
  const padding = 44;
  const values = data.map((point) => getNumber(point[valueKey]));
  const secondaryValues = data.map((point) => getNumber(point[secondaryKey]));
  const maxValue = Math.max(...values, 1);
  const maxSecondaryValue = Math.max(...secondaryValues, 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const [activePoint, setActivePoint] = useState<{
    date: string;
    sales: number;
    averageOrderValue: number;
    orders: number;
    x: number;
    y: number;
  } | null>(null);

  const getPoint = (value: number, index: number, max: number) => {
    const x = padding + (data.length > 1 ? (index / (data.length - 1)) * usableWidth : usableWidth / 2);
    const y = padding + usableHeight - (value / max) * usableHeight;
    return `${x},${y}`;
  };

  const chartPoints = data.map((point, index) => {
    const [x, y] = getPoint(getNumber(point[valueKey]), index, maxValue).split(",").map(Number);

    return {
      date: point.date,
      sales: getNumber(point[valueKey]),
      averageOrderValue: getNumber(point[secondaryKey]),
      orders: point.orders,
      x,
      y,
    };
  });
  const revenuePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const aovPoints = data.map((point, index) => getPoint(getNumber(point[secondaryKey]), index, maxSecondaryValue)).join(" ");
  const tooltipX = activePoint ? (activePoint.x > width - 250 ? activePoint.x - 230 : activePoint.x + 18) : 0;
  const tooltipY = activePoint ? (activePoint.y < 112 ? activePoint.y + 18 : activePoint.y - 102) : 0;

  if (!data.length) {
    return <EmptyChart message="No sales data for this time period." height={height} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + (line / 3) * usableHeight;
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5e7eb" />;
        })}
        <polyline points={revenuePoints} fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
        <polyline points={aovPoints} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        {activePoint && (
          <>
            <line x1={activePoint.x} x2={activePoint.x} y1={padding} y2={height - padding} stroke="#9ca3af" strokeDasharray="4 4" />
            <circle cx={activePoint.x} cy={activePoint.y} r="7" fill="#059669" stroke="#ffffff" strokeWidth="3" />
            <g>
              <rect x={tooltipX} y={tooltipY} width="212" height="88" rx="8" fill="#111827" />
              <text x={tooltipX + 12} y={tooltipY + 20} className="fill-white text-[13px] font-bold">
                {fullDateFormatter.format(new Date(activePoint.date))}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 40} className="fill-gray-200 text-[12px] font-semibold">
                Sales: {formatCurrency(activePoint.sales)}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 58} className="fill-gray-200 text-[12px] font-semibold">
                Average order: {formatCurrency(activePoint.averageOrderValue)}
              </text>
              <text x={tooltipX + 12} y={tooltipY + 76} className="fill-gray-200 text-[12px] font-semibold">
                Paid orders: {formatNumber(activePoint.orders)}
              </text>
            </g>
          </>
        )}
        {chartPoints.map((point) => (
          <g key={point.date}>
            <circle cx={point.x} cy={point.y} r="4" fill="#059669" />
            <circle
              cx={point.x}
              cy={point.y}
              r="14"
              fill="transparent"
              className="cursor-pointer"
              tabIndex={0}
              aria-label={`${fullDateFormatter.format(new Date(point.date))}: ${formatCurrency(point.sales)} sales from ${point.orders} paid orders`}
              onMouseEnter={() => setActivePoint(point)}
              onMouseLeave={() => setActivePoint(null)}
              onFocus={() => setActivePoint(point)}
              onBlur={() => setActivePoint(null)}
            />
          </g>
        ))}
        <text x={padding} y={26} className="fill-gray-500 text-[18px] font-bold">
          Highest day: {formatValue(maxValue)}
        </text>
        <text x={padding} y={height - 12} className="fill-gray-500 text-[18px] font-bold">
          {dateFormatter.format(new Date(data[0].date))}
        </text>
        <text x={width - padding - 80} y={height - 12} className="fill-gray-500 text-[18px] font-bold">
          {dateFormatter.format(new Date(data[data.length - 1].date))}
        </text>
      </svg>
      <div className="flex flex-wrap gap-4 border-t border-gray-100 bg-white px-4 py-3 text-xs font-bold text-gray-600">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Daily sales</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-600" /> Average order value</span>
      </div>
    </div>
  );
}

function DonutChart({ data, total }: { data: StatusMetric[]; total: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const segments = data.map((item, index) => {
    const percentage = total ? item.count / total : 0;
    const dash = percentage * circumference;
    const previousDash = data.slice(0, index).reduce((sum, previousItem) => {
      const previousPercentage = total ? previousItem.count / total : 0;
      return sum + previousPercentage * circumference;
    }, 0);

    return {
      ...item,
      dash,
      offset: 25 - previousDash,
    };
  });

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        {segments.map((item) => (
          <circle
            key={item.status}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={statusColors[item.status] || "#6b7280"}
            strokeWidth="12"
            strokeDasharray={`${item.dash} ${circumference - item.dash}`}
            strokeDashoffset={item.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-black text-gray-950">{total}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Orders</p>
      </div>
    </div>
  );
}

function BarList({
  data,
  valueKey,
  formatValue,
  emptyText,
  reverse = false,
}: {
  data: ProductMetric[];
  valueKey: keyof ProductMetric;
  formatValue: (value: number) => string;
  emptyText: string;
  reverse?: boolean;
}) {
  const values = data.map((item) => getNumber(item[valueKey]));
  const maxValue = Math.max(...values, 1);

  if (!data.length) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const value = getNumber(item[valueKey]);
        const width = `${Math.max((value / maxValue) * 100, 6)}%`;

        return (
          <div key={item.id}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-gray-950">{item.name}</p>
                <p className="text-[10px] font-medium text-gray-500">{item.category}</p>
              </div>
              <span className="shrink-0 text-xs font-black text-gray-950">{formatValue(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full ${reverse ? "bg-amber-500" : "bg-gray-950"}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBarChart({ data, formatValue }: { data: NamedRevenue[]; formatValue: (value: number) => string }) {
  const maxValue = Math.max(...data.map((item) => item.revenue), 1);

  if (!data.length) {
    return <EmptyState text="No sales data yet." />;
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div
          key={item.name}
          className="group grid grid-cols-[110px_1fr_90px] items-center gap-3 rounded-md px-1 py-1 transition hover:bg-gray-50"
          title={`${item.name}: ${formatValue(item.revenue)}`}
        >
          <p className="truncate text-xs font-bold text-gray-700">{item.name}</p>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full origin-left rounded-full bg-sky-600 transition-all duration-300 group-hover:bg-sky-700"
              style={{ width: `${Math.max((item.revenue / maxValue) * 100, 5)}%` }}
            />
          </div>
          <p className="text-right text-xs font-black text-gray-950">{formatValue(item.revenue)}</p>
        </div>
      ))}
    </div>
  );
}

function DataTable({
  columns,
  rows,
  emptyText,
  className = "",
}: {
  columns: string[];
  rows: string[][];
  emptyText: string;
  className?: string;
}) {
  if (!rows.length) {
    return <div className={className}><EmptyState text={emptyText} /></div>;
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-100 ${className}`}>
      <table className="w-full min-w-120">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-3 py-3 text-xs font-medium text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightList({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof ShoppingBag;
  items: Array<{ label: string; helper: string }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-600" />
        <p className="text-xs font-black text-gray-950">{title}</p>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <p className="truncate text-xs font-bold text-gray-800">{item.label}</p>
              <p className="text-[10px] font-medium text-gray-500">{item.helper}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs font-medium text-gray-500">{emptyText}</p>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
      <PackageX className="mx-auto mb-2 h-5 w-5 text-gray-400" />
      <p className="text-xs font-semibold text-gray-500">{text}</p>
    </div>
  );
}

function EmptyChart({ message, height }: { message: string; height: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50" style={{ height }}>
      <p className="text-xs font-semibold text-gray-500">{message}</p>
    </div>
  );
}
