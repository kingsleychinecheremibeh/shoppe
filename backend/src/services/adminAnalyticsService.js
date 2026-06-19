import { adminAnalyticsRepository } from "../repositories/adminAnalyticsRepository.js";

const paidStatuses = new Set(["PAID", "SHIPPED", "DELIVERED"]);
const lowStockThreshold = 10;
const dayMs = 24 * 60 * 60 * 1000;

const rangeDays = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const getNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const getRangeWindow = (range) => {
  const normalizedRange = rangeDays[range] ? range : "30d";
  const days = rangeDays[normalizedRange];

  if (!days) {
    return {
      range: "all",
      fromDate: null,
      previousFromDate: null,
      previousToDate: null,
      days: null,
    };
  }

  const today = startOfDay(new Date());
  const fromDate = new Date(today.getTime() - (days - 1) * dayMs);
  const previousToDate = fromDate;
  const previousFromDate = new Date(previousToDate.getTime() - days * dayMs);

  return {
    range: normalizedRange,
    fromDate,
    previousFromDate,
    previousToDate,
    days,
  };
};

const getPaidOrders = (orders) => orders.filter((order) => paidStatuses.has(order.status));

const getRevenue = (orders) => {
  return getPaidOrders(orders).reduce((sum, order) => sum + getNumber(order.total), 0);
};

const getUnitsSold = (orders) => {
  return getPaidOrders(orders).reduce((sum, order) => {
    return sum + order.orderItems.reduce((itemSum, item) => itemSum + getNumber(item.quantity), 0);
  }, 0);
};

const getRevenueChange = (currentRevenue, previousRevenue) => {
  if (previousRevenue <= 0) return currentRevenue > 0 ? 100 : 0;
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
};

const buildRevenueTrend = (orders, fromDate, days) => {
  const paidOrders = getPaidOrders(orders);
  const bucketMap = new Map();

  if (fromDate && days) {
    for (let index = 0; index < days; index++) {
      const date = new Date(fromDate.getTime() + index * dayMs);
      const key = date.toISOString().slice(0, 10);
      bucketMap.set(key, { date: key, revenue: 0, orders: 0, aov: 0 });
    }
  }

  paidOrders.forEach((order) => {
    const key = startOfDay(order.createdAt).toISOString().slice(0, 10);
    const bucket = bucketMap.get(key) || { date: key, revenue: 0, orders: 0, aov: 0 };

    bucket.revenue += getNumber(order.total);
    bucket.orders += 1;
    bucket.aov = bucket.orders ? bucket.revenue / bucket.orders : 0;
    bucketMap.set(key, bucket);
  });

  return Array.from(bucketMap.values()).sort((first, second) => first.date.localeCompare(second.date));
};

const buildRevenueByCategory = (orders) => {
  const categoryMap = new Map();

  getPaidOrders(orders).forEach((order) => {
    order.orderItems.forEach((item) => {
      const categoryName = item.product?.category?.name || "Uncategorized";
      const revenue = getNumber(item.price) * getNumber(item.quantity);
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + revenue);
    });
  });

  return Array.from(categoryMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((first, second) => second.revenue - first.revenue)
    .slice(0, 8);
};

const buildPaymentGatewayBreakdown = (orders) => {
  const gatewayMap = new Map();

  getPaidOrders(orders).forEach((order) => {
    const gateway = order.paymentGateway || "Unknown";
    gatewayMap.set(gateway, (gatewayMap.get(gateway) || 0) + getNumber(order.total));
  });

  return Array.from(gatewayMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((first, second) => second.revenue - first.revenue);
};

const buildProductPerformance = (orders, products) => {
  const performanceMap = new Map();

  products.forEach((product) => {
    performanceMap.set(product.id, {
      id: product.id,
      name: product.name,
      category: product.category?.name || "Uncategorized",
      stock: product.stock,
      units: 0,
      revenue: 0,
    });
  });

  getPaidOrders(orders).forEach((order) => {
    order.orderItems.forEach((item) => {
      if (!performanceMap.has(item.productId)) return;

      const existing = performanceMap.get(item.productId);
      const quantity = getNumber(item.quantity);

      existing.units += quantity;
      existing.revenue += getNumber(item.price) * quantity;
    });
  });

  const productsWithPerformance = Array.from(performanceMap.values());

  return {
    bestByUnits: [...productsWithPerformance].sort((first, second) => second.units - first.units).slice(0, 8),
    bestByRevenue: [...productsWithPerformance].sort((first, second) => second.revenue - first.revenue).slice(0, 8),
    leastSold: productsWithPerformance
      .filter((product) => product.units > 0)
      .sort((first, second) => first.units - second.units)
      .slice(0, 8),
    stockWithZeroSales: productsWithPerformance
      .filter((product) => product.stock > 0 && product.units === 0)
      .sort((first, second) => second.stock - first.stock)
      .slice(0, 8),
  };
};

const buildInventory = (products, productPerformance) => {
  const lowStock = products
    .filter((product) => product.stock > 0 && product.stock < lowStockThreshold)
    .sort((first, second) => first.stock - second.stock)
    .slice(0, 8)
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      category: product.category?.name || "Uncategorized",
    }));

  const outOfStock = products
    .filter((product) => product.stock <= 0)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category?.name || "Uncategorized",
    }));

  const stockValue = products.reduce((sum, product) => sum + getNumber(product.price) * getNumber(product.stock), 0);
  const performanceByProductId = new Map(productPerformance.bestByUnits.map((product) => [product.id, product]));

  const fastMoving = products
    .map((product) => {
      const performance = performanceByProductId.get(product.id);
      const units = performance?.units || 0;
      const riskScore = product.stock > 0 ? units / product.stock : units;

      return {
        id: product.id,
        name: product.name,
        stock: product.stock,
        units,
        riskScore,
      };
    })
    .filter((product) => product.units > 0 && product.stock < lowStockThreshold)
    .sort((first, second) => second.riskScore - first.riskScore)
    .slice(0, 8);

  return {
    lowStock,
    outOfStock,
    stockValue,
    fastMoving,
    slowMoving: productPerformance.stockWithZeroSales,
  };
};

const buildFulfillment = (orders) => {
  const statusCounts = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));

  const now = Date.now();
  const agingPaidOrders = orders
    .filter((order) => {
      return order.status === "PAID" && now - new Date(order.createdAt).getTime() > 3 * dayMs;
    })
    .slice(0, 8)
    .map((order) => ({
      id: order.id,
      customer: order.user?.name || "Unknown",
      total: getNumber(order.total),
      ageDays: Math.floor((now - new Date(order.createdAt).getTime()) / dayMs),
    }));

  return {
    statusCounts,
    pendingOrders: orders.filter((order) => order.status === "PENDING").length,
    paidNotShipped: orders.filter((order) => order.status === "PAID").length,
    shipped: orders.filter((order) => order.status === "SHIPPED").length,
    delivered: orders.filter((order) => order.status === "DELIVERED").length,
    agingPaidOrders,
  };
};

const buildCustomerValue = (orders) => {
  const customerMap = new Map();

  getPaidOrders(orders).forEach((order) => {
    if (!order.user?.id) return;

    const existing = customerMap.get(order.user.id) || {
      id: order.user.id,
      name: order.user.name,
      email: order.user.email,
      spend: 0,
      orders: 0,
    };

    existing.spend += getNumber(order.total);
    existing.orders += 1;
    customerMap.set(order.user.id, existing);
  });

  const customers = Array.from(customerMap.values());
  const repeatCustomers = customers.filter((customer) => customer.orders > 1).length;

  return {
    topCustomers: customers.sort((first, second) => second.spend - first.spend).slice(0, 6),
    repeatPurchaseRate: customers.length ? (repeatCustomers / customers.length) * 100 : 0,
    averageOrderCount: customers.length
      ? customers.reduce((sum, customer) => sum + customer.orders, 0) / customers.length
      : 0,
  };
};

const buildMediaQuality = (products) => {
  const rows = products.map((product) => {
    const galleryCount = product.images?.length || 0;
    const colorTaggedCount = product.images?.filter((image) => image.color)?.length || 0;
    const hasPrimaryImage = product.images?.some((image) => image.isPrimary) || false;
    const hasLegacyImage = Boolean(product.image);
    const issueCount = [
      !hasLegacyImage && galleryCount === 0,
      hasLegacyImage && galleryCount === 0,
      galleryCount > 0 && !hasPrimaryImage,
      galleryCount > 0 && colorTaggedCount === 0,
    ].filter(Boolean).length;

    return {
      id: product.id,
      name: product.name,
      category: product.category?.name || "Uncategorized",
      hasLegacyImage,
      galleryCount,
      colorTaggedCount,
      hasPrimaryImage,
      issueCount,
    };
  });

  return {
    summary: {
      noImage: rows.filter((product) => !product.hasLegacyImage && product.galleryCount === 0).length,
      onlyLegacyImage: rows.filter((product) => product.hasLegacyImage && product.galleryCount === 0).length,
      withGallery: rows.filter((product) => product.galleryCount > 0).length,
      withColorTaggedGallery: rows.filter((product) => product.colorTaggedCount > 0).length,
      noPrimaryGalleryImage: rows.filter((product) => product.galleryCount > 0 && !product.hasPrimaryImage).length,
    },
    needsWork: rows
      .filter((product) => product.issueCount > 0)
      .sort((first, second) => second.issueCount - first.issueCount)
      .slice(0, 10),
  };
};

export const adminAnalyticsService = {
  async getDashboard(range = "30d") {
    const window = getRangeWindow(range);
    const [orders, previousOrders, products] = await Promise.all([
      adminAnalyticsRepository.findOrders(window.fromDate),
      adminAnalyticsRepository.findPreviousOrders({
        fromDate: window.previousFromDate,
        toDate: window.previousToDate,
      }),
      adminAnalyticsRepository.findProducts(),
    ]);

    const paidOrders = getPaidOrders(orders);
    const grossRevenue = getRevenue(orders);
    const previousRevenue = getRevenue(previousOrders);
    const unitsSold = getUnitsSold(orders);
    const productPerformance = buildProductPerformance(orders, products);

    return {
      range: window.range,
      summary: {
        grossRevenue,
        paidOrders: paidOrders.length,
        unitsSold,
        averageOrderValue: paidOrders.length ? grossRevenue / paidOrders.length : 0,
        stockAlerts: products.filter((product) => product.stock < lowStockThreshold).length,
        cancelRate: orders.length
          ? (orders.filter((order) => order.status === "CANCELLED").length / orders.length) * 100
          : 0,
        revenueChange: getRevenueChange(grossRevenue, previousRevenue),
      },
      revenue: {
        trend: buildRevenueTrend(orders, window.fromDate, window.days),
        byCategory: buildRevenueByCategory(orders),
        byPaymentGateway: buildPaymentGatewayBreakdown(orders),
      },
      products: productPerformance,
      inventory: buildInventory(products, productPerformance),
      fulfillment: buildFulfillment(orders),
      customers: buildCustomerValue(orders),
      media: buildMediaQuality(products),
    };
  },
};
