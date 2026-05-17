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


const router = express.Router();

router.get("/", getCategories);
router.post("/", protect, adminOnly, validate(categorySchema), createCategory);
router.put("/:id", protect, adminOnly, validate(categorySchema), updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;
