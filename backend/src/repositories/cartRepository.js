import { prisma } from "../config/db.js";

export const cartRepository = {
    findByUserId: (userId) => {
        return prisma.cart.findUnique({ where: { userId } });
    },

    create: (userId) => {
        return prisma.cart.create({ data: { userId } });
    },

    findWithItems: (cartId) => {
        return prisma.cart.findUnique({
            where: { id: cartId },
            include: {
                items: {
                    include: { product: true },
                    orderBy: { createdAt: "desc" },
                },
            },
        });
    },

    findItemById: (id) => {
        return prisma.cartItem.findUnique({
            where: { id },
            include: { product: true },
        });
    },

    findItemByCartAndProduct: (cartId, productId) => {
        return prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId, productId } },
        });
    },

    createItem: (data) => {
        return prisma.cartItem.create({ data, include: { product: true } });
    },

    updateItem: (id, data) => {
        return prisma.cartItem.update({ where: { id }, data, include: { product: true } });
    },

    deleteItem: (id) => {
        return prisma.cartItem.delete({ where: { id } });
    },

    clearItems: (cartId) => {
        return prisma.cartItem.deleteMany({ where: { cartId } });
    },

    findProductById: (id) => {
        return prisma.product.findFirst({ where: { id, deletedAt: null } });
    },
};
