import { orderRepository } from "../repositories/orderRepository.js";
import { AppError } from "../utils/AppError.js";


const ORDER_STATUSES = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const orderService = {
  async createOrder(userId, addressId, idempotencyKey, paymentGateway, paymentReference) {
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
      if (item.quantity > item.product.stock) {
        throw new AppError(
          `${item.product.name} does not have enough stock`,
          400
        );
      }
    }

    const total = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    return orderRepository.createOrderTransaction({
      userId,
      addressId,
      address,
      cart,
      total,
      idempotencyKey,
      paymentGateway,
      paymentReference
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

    if (!isOwner && !isAdmin) {
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

    return orderRepository.updateOrderStatus(orderId, status);
  },

  async deleteOrder(orderId) {
    const order = await orderRepository.findOrderById(orderId);

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    return orderRepository.deleteOrder(orderId);
  },
};