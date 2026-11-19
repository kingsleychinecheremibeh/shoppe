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
    createOrderTransaction: async ({ userId, addressId, address, cart, subtotal, shippingFee, total, shippingMethodId, shippingMethodName, idempotencyKey, paymentGateway }) => {
        return prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    addressId,
                    subtotal,
                    shippingFee,
                    total,
                    shippingMethodId,
                    shippingMethodName,
                    shippingName: address.fullName,
                    shippingPhone: address.phone,
                    shippingStreet: address.street,
                    shippingCity: address.city,
                    shippingState: address.state,
                    shippingCountry: address.country,
                    idempotencyKey,
                    status: "PENDING",
                    paymentGateway,
                    orderItems: {
                        create: cart.items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.product.price,
                            selectedColor: item.selectedColor,
                            productImageId: item.productImageId,
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

    /**
     * Moves an order from PENDING to PAID only if it is still PENDING.
     * Returns true when this call made the change, false if the order had already moved on
     * (for example it was cancelled by the unpaid-order expiry job).
     */
    markPaidIfPending: async (id) => {
        const result = await prisma.order.updateMany({
            where: { id, status: "PENDING" },
            data: { status: "PAID" },
        });
        return result.count === 1;
    },

    /**
     * Cancels an order and returns its items to stock, in one transaction.
     * Only PENDING or PAID orders hold stock, so only those are restocked; the conditional
     * update also guarantees stock is returned at most once, even under concurrent calls.
     * Returns the updated order, or null if the order was not in a restockable state.
     */
    cancelOrderAndRestock: (id) => {
        return prisma.$transaction(async (tx) => {
            const result = await tx.order.updateMany({
                where: { id, status: { in: ["PENDING", "PAID"] } },
                data: { status: "CANCELLED" },
            });

            if (result.count === 0) {
                return null;
            }

            const items = await tx.orderItem.findMany({
                where: { orderId: id },
                select: { productId: true, quantity: true },
            });

            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }

            return tx.order.findUnique({
                where: { id },
                include: {
                    orderItems: { include: { product: true } },
                    address: true,
                },
            });
        });
    },

    /** IDs of unpaid orders created before `cutoff`. */
    findExpiredPendingOrderIds: async (cutoff) => {
        const orders = await prisma.order.findMany({
            where: { status: "PENDING", createdAt: { lt: cutoff } },
            select: { id: true },
            take: 200,
        });
        return orders.map((order) => order.id);
    },

    /**
     * Deletes an order. If it still held stock (PENDING or PAID), the stock is returned first.
     */
    deleteOrder: (id, { restock = false } = {}) => {
        return prisma.$transaction(async (tx) => {
            const items = await tx.orderItem.findMany({
                where: { orderId: id },
                select: { productId: true, quantity: true },
            });

            if (restock) {
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }

            await tx.orderItem.deleteMany({
                where: { orderId: id },
            });

            return tx.order.delete({
                where: { id },
            });
        });
    },

    findOrderByIdempotencyKey: (idempotencyKey, userId) => {
        if (!idempotencyKey) return null;
        return prisma.order.findFirst({
            where: {
                idempotencyKey,
                userId,
            },
            include: {
                orderItems: {
                    include: { product: true }
                },
                address: true,
            },
        });
    },
};
