import express from "express";
import {
  getActiveShippingMethods,
  getAllShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from "../controllers/shippingController.js";
import { protect, staffWithPermission } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { shippingMethodSchema } from "../validators/shippingValidator.js";

const router = express.Router();

router.get("/", protect, getActiveShippingMethods);
router.get("/admin", protect, staffWithPermission("SHIPPING_MANAGEMENT"), getAllShippingMethods);
router.post("/", protect, staffWithPermission("SHIPPING_MANAGEMENT"), validate(shippingMethodSchema), createShippingMethod);
router.put("/:id", protect, staffWithPermission("SHIPPING_MANAGEMENT"), validate(shippingMethodSchema.partial()), updateShippingMethod);
router.delete("/:id", protect, staffWithPermission("SHIPPING_MANAGEMENT"), deleteShippingMethod);

export default router;
