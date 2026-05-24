import { orderService } from "../services/orderService.js";
import { orderRepository } from "../repositories/orderRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createOrder = asyncHandler(async (req, res) => {
  const headers = req.headers || {};
  const idempotencyKey = headers["idempotency-key"];
  const { addressId, shippingMethodId, paymentGateway } = req.body;

  if (idempotencyKey) {
    const existingOrder = await orderRepository.findOrderByIdempotencyKey(idempotencyKey);

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
  res.json(order);
});

export const deleteOrder = asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  res.json({ message: "Order deleted successfully" });
});
