import { productService } from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { invalidateCache } from "../middleware/cacheMiddleware.js";

export const getProducts = asyncHandler(async (req, res) => {
    const query = req.query || {};
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 12);
    const skip = (page - 1) * limit;
    const { category, search, sort } = query;
    const { products, totalCount } = await productService.getAll({
        skip,
        take: limit,
        categorySlug: category,
        search,
        sortBy: sort
    });

    res.json({
        data: products,
        meta: {
            currentPage: page,
            limit,
            totalItems: totalCount,
            totalPages: Math.ceil(totalCount / limit)
        }
    });
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getById(req.params.id);
    res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
    const product = await productService.create(req.body);
    invalidateCache("/products");
    res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    invalidateCache("/products");
    res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.delete(req.params.id);
    invalidateCache("/products");
    res.json({ message: "Product deleted successfully" });
});
