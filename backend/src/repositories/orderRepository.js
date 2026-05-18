import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const orderRepository = {
    findAddressById: (id) => {
        return prisma.address.findUnique({ where: { id } });
    },
    findCartByUserId: (userId) => {
        return prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: { product: true },
                },
            },
        });
    },

    // address is validated and fetched in the service layer before being passed here
    createOrderTransaction: async ({ userId, addressId, address, cart, total, idempotencyKey, paymentGateway, paymentReference }) => {
        return prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    addressId,
                    total,
                    shippingName: address.fullName,
                    shippingPhone: address.phone,
                    shippingStreet: address.street,
                    shippingCity: address.city,
                    shippingState: address.state,
                    shippingCountry: address.country,
                    idempotencyKey,
                    status: paymentReference ? "PAID" : "PENDING",
                    paymentGateway,
                    paymentReference,
                    orderItems: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                        })),
                    },
                },
                include: {
                    orderItems: {
                        include: { product: true },
                    },
                    address: true,
                },
            });

            for (const item of cart.items) {
                const result = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });

                if (result.count === 0) {
                    throw new AppError(`${item.product.name} does not have enough stock`, 400);
                }
            }

            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return createdOrder;
        });
    },

    findOrdersByUserId: (userId) => {
        return prisma.order.findMany({
            where: { userId },
            include: {
                orderItems: {
                    include: { product: true },
                },
                address: true,
            },
            orderBy: { createdAt: "desc" },
        });
    },

    findOrderById: (id) => {
        return prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: { product: true },
                },
                address: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
    },

    findAllOrders: () => {
        return prisma.order.findMany({
            include: {
                orderItems: {
                    include: { product: true },
                },
                address: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    updateOrderStatus: (id, status) => {
        return prisma.order.update({
            where: { id },
            data: { status },
            include: {
                orderItems: {
                    include: { product: true },
                },
                address: true,
            },
        });
    },

    deleteOrder: (id) => {
        return prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({
                where: { orderId: id },
            });

            return tx.order.delete({
                where: { id },
            });
        });
    },

    findOrderByIdempotencyKey: (idempotencyKey) => {
        if (!idempotencyKey) return null;
        return prisma.order.findUnique({
            where: { idempotencyKey },
            include: {
                orderItems: {
                    include: { product: true }
                },
                address: true,
            },
        });
    },
};

