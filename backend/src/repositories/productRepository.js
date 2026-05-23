import { prisma } from "../config/db.js";

export const productRepository = {
    create: (data) => {
        return prisma.product.create({ data, include: { category: true } });
    },
    update: (id, data) => {
        return prisma.product.update({ where: { id }, data, include: { category: true } });
    },
    findAll: async ({ skip = 0, take = 12, categorySlug, search, sortBy }) => {
        const where = { deletedAt: null }
        if (categorySlug && categorySlug !== "all") {
            where.category = { slug: categorySlug };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                {
                    category: {
                        name: { contains: search, mode: "insensitive" },
                    },
                },
                {
                    category: {
                        slug: { contains: search, mode: "insensitive" },
                    },
                },
            ];
        }

        let orderBy = { createdAt: "desc" };
        if (sortBy === "price-asc") {
            orderBy = { price: "asc" };
        } else if (sortBy === "price-desc") {
            orderBy = { price: "desc" };
        } else if (sortBy === "name-asc") {
            orderBy = { name: "asc" };
        } else if (sortBy === "name-desc") {
            orderBy = { name: "desc" };
        }

        const [products, totalCount] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                include: { category: true },
                orderBy
            }),
            prisma.product.count({ where })
        ]);

        return { products, totalCount };
    },
    findById: (id) => {
        return prisma.product.findFirst({ where: { id, deletedAt: null }, include: { category: true } });
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
