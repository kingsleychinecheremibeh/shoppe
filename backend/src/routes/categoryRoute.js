import express from "express";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";
import { protect, staffWithPermission } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { categorySchema } from "../validators/categoryValidator.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";


const router = express.Router();

router.get("/", cacheMiddleware(300), getCategories);
router.post("/", protect, staffWithPermission("PRODUCT_MANAGEMENT"), validate(categorySchema), createCategory);
router.put("/:id", protect, staffWithPermission("PRODUCT_MANAGEMENT"), validate(categorySchema), updateCategory);
router.delete("/:id", protect, staffWithPermission("PRODUCT_MANAGEMENT"), deleteCategory);

export default router;
