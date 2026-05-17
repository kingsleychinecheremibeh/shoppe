import { cartRepository } from "../repositories/cartRepository.js";
import { productRepository } from "../repositories/productRepository.js";
import { parsePositiveInteger } from "../validators/numberValidator.js";
import { AppError } from "../utils/AppError.js";

const getOrCreateCart = async (userId) => {
    let cart = await cartRepository.findByUserId(userId);
    if (!cart) cart = await cartRepository.create(userId);
    return cart;
};

export const cartService = {
    async getCart(userId) {
        const cart = await getOrCreateCart(userId);
        return cartRepository.findWithItems(cart.id);
    },

    async addItem(userId, productId, quantity) {
        if (!productId) {
            throw new AppError("Product ID is required", 400);
        }

        const parsedQuantity = parsePositiveInteger(quantity);
        if (parsedQuantity === null) {
            throw new AppError("Quantity must be a positive whole number", 400);
        }

        const product = await productRepository.findById(productId);
        if (!product) {
            throw new AppError("Product not found", 404);
        }

        const cart = await getOrCreateCart(userId);

        const existingItem = await cartRepository.findItemByCartAndProduct(cart.id, productId);
        const newQuantity = existingItem ? existingItem.quantity + parsedQuantity : parsedQuantity;

        if (newQuantity > product.stock) {
            throw new AppError("Not enough stock available", 400);
        }

        if (existingItem) {
            return cartRepository.updateItem(existingItem.id, { quantity: newQuantity });
        }

        return cartRepository.createItem({ cartId: cart.id, productId, quantity: parsedQuantity });
    },

    async updateItem(userId, cartItemId, quantity) {
        const parsedQuantity = parsePositiveInteger(quantity);
        if (parsedQuantity === null) {
            throw new AppError("Quantity must be a positive whole number", 400);
        }

        const cart = await getOrCreateCart(userId);
        const cartItem = await cartRepository.findItemById(cartItemId);

        if (!cartItem || cartItem.cartId !== cart.id) {
            throw new AppError("Cart item not found", 404);
        }

        if (parsedQuantity > cartItem.product.stock) {
            throw new AppError("Not enough stock available", 400);
        }

        return cartRepository.updateItem(cartItemId, { quantity: parsedQuantity });
    },

    async removeItem(userId, cartItemId) {
        const cart = await getOrCreateCart(userId);
        const cartItem = await cartRepository.findItemById(cartItemId);

        if (!cartItem || cartItem.cartId !== cart.id) {
            throw new AppError("Cart item not found", 404);
        }

        return cartRepository.deleteItem(cartItemId);
    },

    async clearCart(userId) {
        const cart = await getOrCreateCart(userId);
        return cartRepository.clearItems(cart.id);
    },
};
