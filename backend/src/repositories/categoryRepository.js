import { prisma } from "../config/db.js";

export const categoryRepository = {
  findAll: () => {
    return prisma.category.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  findById: (id) => {
    return prisma.category.findFirst({
      where: { id, isDeleted: false },
      include: {
        products: true,
      },
    });
  },

  findBySlug: (slug) => {
    return prisma.category.findFirst({
      where: { slug, isDeleted: false },
    });
  },

  create: (data) => {
    return prisma.category.create({
      data,
    });
  },

  update: (id, data) => {
    return prisma.category.update({
      where: { id },
      data,
    });
  },

  delete: (id) => {
    return prisma.category.update({
      where: { id },
      data: { isDeleted: true },
    });
  },
};