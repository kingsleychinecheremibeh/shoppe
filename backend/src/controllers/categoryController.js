import { categoryService } from "../services/categoryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getCategories();
    res.json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body.name);
    res.status(201).json(category);
});

export const updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(req.params.id, req.body.name);
    res.json(category);
});

export const deleteCategory = asyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    res.json({ message: "Category deleted successfully" });
});
