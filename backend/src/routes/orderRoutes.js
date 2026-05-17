import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/orderValidator.js";

const router = express.Router();

router.post("/", protect, validate(createOrderSchema), createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, validate(updateOrderStatusSchema), updateOrderStatus);
router.get("/:id", protect, getOrderById);
router.delete("/:id", protect, adminOnly, deleteOrder); 

export default router;
