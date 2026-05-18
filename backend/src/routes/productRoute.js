import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidator.js";
import { validate } from "../middleware/validateMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

router.get("/", cacheMiddleware(300), getProducts);
router.get("/:id", cacheMiddleware(300), getProductById);
router.post("/", protect, adminOnly, validate(createProductSchema), createProduct);
router.put("/:id", protect, adminOnly, validate(updateProductSchema), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
