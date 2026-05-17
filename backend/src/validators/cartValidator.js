import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive whole number"),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be a positive whole number"),
});
