import { productService } from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { invalidateCache } from "../middleware/cacheMiddleware.js";
import { auditRepository } from "../repositories/auditRepository.js";
import { notificationService } from "../services/notificationService.js";

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
    await auditRepository.log({
        req,
        action: "PRODUCT_CREATED",
        entity: "PRODUCT",
        entityId: product.id,
        metadata: { name: product.name },
    });
    await notificationService.notifyNewProduct(product);
    invalidateCache("/products");
    res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body);
    await auditRepository.log({
        req,
        action: "PRODUCT_UPDATED",
        entity: "PRODUCT",
        entityId: product.id,
        metadata: { fields: Object.keys(req.body) },
    });
    invalidateCache("/products");
    res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await productService.delete(req.params.id);
    await auditRepository.log({
        req,
        action: "PRODUCT_DELETED",
        entity: "PRODUCT",
        entityId: req.params.id,
    });
    invalidateCache("/products");
    res.json({ message: "Product deleted successfully" });
});

export const addProductImage = asyncHandler(async (req, res) => {
    const image = await productService.addImage(req.params.productId, req.body);

    await auditRepository.log({
        req,
        action: "PRODUCT_IMAGE_ADDED",
        entity: "PRODUCT",
        entityId: req.params.productId,
        metadata: {
            imageId: image.id,
            color: image.color,
            isPrimary: image.isPrimary,
        },
    });

    invalidateCache("/products");

    res.status(201).json(image);
});

export const deleteProductImage = asyncHandler(async (req, res) => {
    await productService.deleteImage(req.params.productId, req.params.imageId);

    await auditRepository.log({
        req,
        action: "PRODUCT_IMAGE_DELETED",
        entity: "PRODUCT",
        entityId: req.params.productId,
        metadata: {
            imageId: req.params.imageId,
        },
    });

    invalidateCache("/products");

    res.json({ message: "Product image deleted successfully" });
});

export const setPrimaryProductImage = asyncHandler(async (req, res) => {
    const image = await productService.setPrimaryImage(
        req.params.productId,
        req.params.imageId
    );

    await auditRepository.log({
        req,
        action: "PRODUCT_PRIMARY_IMAGE_UPDATED",
        entity: "PRODUCT",
        entityId: req.params.productId,
        metadata: {
            imageId: req.params.imageId,
        },
    });

    invalidateCache("/products");

    res.json(image);
});
