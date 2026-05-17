import { prisma } from "../config/db.js";

export const productRepository = {
    create: (data) => {
        return prisma.product.create({ data, include: { category: true } });
    },
    update: (id, data) => {
        return prisma.product.update({ where: { id }, data, include: { category: true } });
    },
    findAll: () => {
        return prisma.product.findMany({ where: { deletedAt: null }, include: { category: true }, orderBy: { createdAt: "desc" } });
    },
    findById: (id) => {
        return prisma.product.findFirst({ where: { id, deletedAt: null}, include: { category: true } });
    },
    findBySlug: (slug) => {
        return prisma.product.findFirst({ where: { slug, deletedAt: null }, include: { category: true } });
    },
    delete: (id) => {
        return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    },
    findCategoryById: (categoryId) => {
        return prisma.category.findFirst({ where: { id: categoryId, isDeleted: false } });
    }
};
