import { prisma } from "../config/db.js";

const productInclude = {
    category: true,
    images: {
        orderBy: { sortOrder: "asc" },
    },
};

export const productRepository = {
    create: (data) => {
        return prisma.product.create({ data, include: productInclude });
    },
    update: (id, data) => {
        return prisma.product.update({ where: { id }, data, include: productInclude });
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
                include: productInclude,
                orderBy
            }),
            prisma.product.count({ where })
        ]);
       
        return { products, totalCount };
    },
    findById: (id) => {
        return prisma.product.findFirst({ where: { id, deletedAt: null }, include: productInclude });
    },
    findBySlug: (slug) => {
        return prisma.product.findFirst({ where: { slug, deletedAt: null }, include: productInclude });
    },
    delete: (id) => {
        return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    },
    findCategoryById: (categoryId) => {
        return prisma.category.findFirst({ where: { id: categoryId, isDeleted: false } });
    },
    findImageById: (id) => {
        return prisma.productImage.findUnique({
            where: { id },
        });
    },
    addImage: async (productId, data) => {
        return prisma.$transaction(async (tx) => {
            if (data.isPrimary) {
                await tx.productImage.updateMany({
                    where: { productId },
                    data: { isPrimary: false },
                });
            }

            return tx.productImage.create({
                data: {
                    productId,
                    url: data.url,
                    publicId: data.publicId,
                    altText: data.altText,
                    color: data.color,
                    sortOrder: Number(data.sortOrder ?? 0),
                    isPrimary: Boolean(data.isPrimary),
                },
            });
        });
    },
    deleteImage: (id) => {
        return prisma.productImage.delete({
            where: { id },
        });
    },
    setPrimaryImage: async (productId, imageId) => {
        return prisma.$transaction(async (tx) => {
            await tx.productImage.updateMany({
                where: { productId },
                data: { isPrimary: false },
            });

            return tx.productImage.update({
                where: { id: imageId },
                data: { isPrimary: true },
            });
        });
    },
};
