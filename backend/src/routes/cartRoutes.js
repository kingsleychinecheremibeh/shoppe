import express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { addCartItemSchema, updateCartItemSchema } from "../validators/cartValidator.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/items", protect, validate(addCartItemSchema), addItemToCart);
router.put("/items/:id", protect, validate(updateCartItemSchema), updateCartItem);
router.delete("/items/:id", protect, removeCartItem);
router.delete("/", protect, clearCart);

export default router;
