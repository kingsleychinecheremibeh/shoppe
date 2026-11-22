import { orderRepository } from "../repositories/orderRepository.js";
import { shippingService } from "../services/shippingServices.js";
import { notificationService } from "./notificationService.js";
import { AppError } from "../utils/AppError.js";


const ORDER_STATUSES = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const orderService = {
  async createOrder(userId, addressId, shippingMethodId, idempotencyKey, paymentGateway) {
    if (!addressId) {
      throw new AppError("Address ID is required", 400);
    }

    const address = await orderRepository.findAddressById(addressId);

    if (!address || address.userId !== userId) {
      throw new AppError("Address not found", 404);
    }

    const cart = await orderRepository.findCartByUserId(userId);

    if (!cart || cart.items.length === 0) {
      throw new AppError("Cart is empty", 400);
    }

    for (const item of cart.items) {
      if (item.product.deletedAt) {
        throw new AppError(
          `${item.product.name} is no longer available. Please remove it from your cart.`,
          400
        );
      }

      if (item.quantity > item.product.stock) {
        throw new AppError(
          `${item.product.name} does not have enough stock`,
          400
        );
      }
    }

    const shippingMethod = await shippingService.getActiveMethodById(shippingMethodId);

    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const shippingFee = Number(shippingMethod.price);
    const total = subtotal + shippingFee;

    return orderRepository.createOrderTransaction({
      userId,
      addressId,
      address,
      cart,
      subtotal,
      shippingFee,
      total,
      shippingMethodId: shippingMethod.id,
      shippingMethodName: shippingMethod.name,
      idempotencyKey,
      paymentGateway,
    });
  },

  async getMyOrders(userId) {
    return orderRepository.findOrdersByUserId(userId);
  },

  async getOrderById(orderId, currentUser) {
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const isOwner = order.userId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";
    const isOrderManager =
      currentUser.role === "MANAGER" &&
      Array.isArray(currentUser.managerPermissions) &&
      currentUser.managerPermissions.includes("ORDER_MANAGEMENT");

    if (!isOwner && !isAdmin && !isOrderManager) {
      throw new AppError("Access denied", 403);
    }

    return order;
  },

  async getAllOrders() {
    return orderRepository.findAllOrders();
  },

  async updateOrderStatus(orderId, status) {

    const existingOrder =
      await orderRepository.findOrderById(orderId);

    if (!existingOrder) {
      throw new AppError("Order not found", 404);
    }

    if (existingOrder.status === status) {
      return existingOrder; // No-op: exit gracefully if status is already correct
    }

    const allowedStatuses = ORDER_STATUSES[existingOrder.status];

    if (!allowedStatuses) {
      throw new AppError("Invalid order status", 400);
    }
    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        `Cannot change status from ${existingOrder.status} to ${status}`,
        400
      );
    }

    if (status === "CANCELLED") {
      const cancelledOrder = await orderRepository.cancelOrderAndRestock(orderId);
      if (!cancelledOrder) {
        throw new AppError("This order can no longer be cancelled.", 409);
      }
      return cancelledOrder;
    }

    const updatedOrder = await orderRepository.updateOrderStatus(orderId, status);

    if (status === "SHIPPED") {
      await notificationService.notifyOrderShipped(updatedOrder);
    }

    if (status === "DELIVERED") {
      await notificationService.notifyOrderDelivered(updatedOrder);
    }

    return updatedOrder;
  },

  async deleteOrder(orderId) {
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    // PENDING and PAID orders still hold stock; give it back when the order is removed.
    const restock = order.status === "PENDING" || order.status === "PAID";
    return orderRepository.deleteOrder(orderId, { restock });
  },

  /**
   * Cancels unpaid orders older than `ttlMinutes` and returns their stock.
   * Returns the number of orders cancelled.
   */
  async cancelExpiredPendingOrders(ttlMinutes) {
    const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
    const orderIds = await orderRepository.findExpiredPendingOrderIds(cutoff);

    let cancelled = 0;
    for (const orderId of orderIds) {
      const result = await orderRepository.cancelOrderAndRestock(orderId);
      if (result) cancelled += 1;
    }

    return cancelled;
  },
};
