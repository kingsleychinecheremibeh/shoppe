import { prisma } from "../config/db.js";

export const shippingRepository = {
  findActive: () =>
    prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),

  findAll: () =>
    prisma.shippingMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),

  findById: (id) =>
    prisma.shippingMethod.findUnique({ where: { id } }),

  create: (data) =>
    prisma.shippingMethod.create({ data }),

  update: (id, data) =>
    prisma.shippingMethod.update({
      where: { id },
      data,
    }),

  deactivate: (id) =>
    prisma.shippingMethod.update({
      where: { id },
      data: { isActive: false },
    }),
};