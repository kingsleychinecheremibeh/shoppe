import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect, staffWithPermission } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/orderValidator.js";

const router = express.Router();

router.post("/", protect, validate(createOrderSchema), createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/", protect, staffWithPermission("ORDER_MANAGEMENT"), getAllOrders);
router.put("/:id/status", protect, staffWithPermission("ORDER_MANAGEMENT"), validate(updateOrderStatusSchema), updateOrderStatus);
router.get("/:id", protect, getOrderById);
router.delete("/:id", protect, staffWithPermission("ORDER_MANAGEMENT"), deleteOrder); 

export default router;
