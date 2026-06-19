import { orderService } from "../services/orderService.js";
import { orderRepository } from "../repositories/orderRepository.js";
import { auditRepository } from "../repositories/auditRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createOrder = asyncHandler(async (req, res) => {
  const headers = req.headers || {};
  const idempotencyKey = headers["idempotency-key"];
  const { addressId, shippingMethodId, paymentGateway } = req.body;

  if (idempotencyKey) {
    const existingOrder = await orderRepository.findOrderByIdempotencyKey(idempotencyKey, req.user.id);

    if (existingOrder) {
      return res.status(200).json(existingOrder)
    }
  }
  const order = await orderService.createOrder(
    req.user.id,
    addressId,
    shippingMethodId,
    idempotencyKey,
    paymentGateway
  );
  await auditRepository.log({
    req,
    action: "ORDER_CREATED",
    entity: "ORDER",
    entityId: order.id,
    metadata: { total: order.total, paymentGateway },
  });
  res.status(201).json(order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.id);
  res.json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user
  );

  res.json(order);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getAllOrders();
  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status);
  await auditRepository.log({
    req,
    action: "ORDER_STATUS_UPDATED",
    entity: "ORDER",
    entityId: order.id,
    metadata: { status: order.status },
  });
  res.json(order);
});

export const deleteOrder = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  await auditRepository.log({
    req,
    action: "ORDER_DELETED",
    entity: "ORDER",
    entityId: req.params.id,
  });
  res.json({ message: "Order deleted successfully" });
});
