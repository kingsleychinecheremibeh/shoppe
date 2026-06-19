import { cartService } from "../services/cartService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCart = asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user.id);
    res.json(cart);
});

export const addItemToCart = asyncHandler(async (req, res) => {
    const { productId, quantity, selectedColor, productImageId } = req.body;
    const cartItem = await cartService.addItem(req.user.id, productId, quantity, selectedColor, productImageId);
    res.status(201).json(cartItem);
});

export const updateCartItem = asyncHandler(async (req, res) => {
    const cartItem = await cartService.updateItem(req.user.id, req.params.id, req.body.quantity);
    res.json(cartItem);
});

export const removeCartItem = asyncHandler(async (req, res) => {
    await cartService.removeItem(req.user.id, req.params.id);
    res.json({ message: "Cart item removed successfully" });
});

export const clearCart = asyncHandler(async (req, res) => {
    await cartService.clearCart(req.user.id);
    res.json({ message: "Cart cleared successfully" });
});
