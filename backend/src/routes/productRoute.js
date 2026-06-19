import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  setPrimaryProductImage,
} from "../controllers/productController.js";
import { protect, staffWithPermission } from "../middleware/authMiddleware.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidator.js";
import { validate } from "../middleware/validateMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

router.get("/", cacheMiddleware(300), getProducts);
router.get("/:id", cacheMiddleware(300), getProductById);
router.post("/", protect, staffWithPermission("PRODUCT_MANAGEMENT"), validate(createProductSchema), createProduct);
router.put("/:id", protect, staffWithPermission("PRODUCT_MANAGEMENT"), validate(updateProductSchema), updateProduct);
router.delete("/:id", protect, staffWithPermission("PRODUCT_MANAGEMENT"), deleteProduct);
router.post("/:productId/images", protect, staffWithPermission("PRODUCT_MANAGEMENT"), addProductImage);
router.delete("/:productId/images/:imageId", protect, staffWithPermission("PRODUCT_MANAGEMENT"), deleteProductImage);
router.patch("/:productId/images/:imageId/primary", protect, staffWithPermission("PRODUCT_MANAGEMENT"), setPrimaryProductImage);

export default router;
