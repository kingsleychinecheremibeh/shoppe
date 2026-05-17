import { productService } from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProducts = asyncHandler(async (req, res) => {
    const products = await productService.getAll();
    res.json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.create(req.body);
    res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.delete(req.params.id);
    res.json({ message: "Product deleted successfully" });
});
