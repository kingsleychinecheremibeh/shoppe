import { prisma } from "../config/db.js";

const orderInclude = {
  orderItems: {
    include: {
      product: {
        include: {
          category: true,
          images: true,
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const productInclude = {
  category: true,
  images: true,
};

export const adminAnalyticsRepository = {
  findOrders: (fromDate) => {
    return prisma.order.findMany({
      where: fromDate ? { createdAt: { gte: fromDate } } : undefined,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findPreviousOrders: ({ fromDate, toDate }) => {
    if (!fromDate || !toDate) return [];

    return prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lt: toDate,
        },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  },

  findProducts: () => {
    return prisma.product.findMany({
      where: { deletedAt: null },
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });
  },
};
