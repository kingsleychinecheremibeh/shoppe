import express from "express";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/categoryController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { categorySchema } from "../validators/categoryValidator.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";


const router = express.Router();

router.get("/", cacheMiddleware(300), getCategories);
router.post("/", protect, adminOnly, validate(categorySchema), createCategory);
router.put("/:id", protect, adminOnly, validate(categorySchema), updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
