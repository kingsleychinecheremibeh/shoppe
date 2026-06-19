import { notificationRepository } from "../repositories/notificationRepository.js";
import { userRepository } from "../repositories/userRepository.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const buildOrderNumber = (orderId) => `#${orderId.slice(0, 8).toUpperCase()}`;

const createForUsers = async (users, payload) => {
  const notifications = users.map((user) => ({
    userId: user.id,
    ...payload,
    dedupeKey: payload.dedupeKey ? `${user.id}:${payload.dedupeKey}` : undefined,
  }));

  await notificationRepository.createMany(notifications);
};

const getOrderCustomerName = (order) => {
  return order.user?.name || order.shippingName || order.address?.fullName || "A customer";
};

export const notificationService = {
  async notifyPaymentReceived(order) {
    if (!UUID_PATTERN.test(order.id)) return;

    const staff = await userRepository.findStaffByPermission("ORDER_MANAGEMENT");
    await createForUsers(staff, {
      audience: "STAFF",
      type: "PAYMENT_RECEIVED",
      title: "Payment received",
      message: `${getOrderCustomerName(order)} paid ${Number(order.total).toLocaleString("en-US", {
        style: "currency",
        currency: "NGN",
      })} for order ${buildOrderNumber(order.id)}.`,
      metadata: {
        orderId: order.id,
        total: String(order.total),
        paymentGateway: order.paymentGateway,
      },
      dedupeKey: `PAYMENT_RECEIVED:${order.id}`,
    });
  },

  async notifyOrderShipped(order) {
    if (!UUID_PATTERN.test(order.id)) return;

    await createForUsers([{ id: order.userId }], {
      audience: "CUSTOMER",
      type: "ORDER_SHIPPED",
      title: "Your order is on the way",
      message: `Order ${buildOrderNumber(order.id)} is now being shipped.`,
      metadata: { orderId: order.id },
      dedupeKey: `ORDER_SHIPPED:${order.id}`,
    });
  },

  async notifyOrderDelivered(order) {
    if (!UUID_PATTERN.test(order.id)) return;

    await createForUsers([{ id: order.userId }], {
      audience: "CUSTOMER",
      type: "ORDER_DELIVERED",
      title: "Your order has been delivered",
      message: `Order ${buildOrderNumber(order.id)} has been marked as delivered.`,
      metadata: { orderId: order.id },
      dedupeKey: `ORDER_DELIVERED:${order.id}`,
    });
  },

  async notifyNewProduct(product) {
    const customers = await userRepository.findCustomersForProductAnnouncements();
    await createForUsers(customers, {
      audience: "CUSTOMER",
      type: "NEW_PRODUCT",
      title: "New product added",
      message: `${product.name} is now available in the shop.`,
      metadata: {
        productId: product.id,
        slug: product.slug,
      },
      dedupeKey: `NEW_PRODUCT:${product.id}`,
    });
  },

  getForUser(userId, options) {
    return notificationRepository.findForUser(userId, options);
  },

  async markRead(id, userId) {
    return notificationRepository.markRead(id, userId);
  },

  async markAllRead(userId) {
    return notificationRepository.markAllReadForUser(userId);
  },
};
