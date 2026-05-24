import express from "express";
import {
  getActiveShippingMethods,
  getAllShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "../controllers/shippingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { shippingMethodSchema } from "../validators/shippingValidator.js";

const router = express.Router();

router.get("/", protect, getActiveShippingMethods);
router.get("/admin", protect, adminOnly, getAllShippingMethods);
router.post("/", protect, adminOnly, validate(shippingMethodSchema), createShippingMethod);
router.put("/:id", protect, adminOnly, validate(shippingMethodSchema.partial()), updateShippingMethod);
router.delete("/:id", protect, adminOnly, deleteShippingMethod);

export default router;