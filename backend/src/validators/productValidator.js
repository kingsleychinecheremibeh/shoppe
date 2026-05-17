import { z } from "zod";
export const createProductSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().min(5),
    price: z.number().positive(),
    stock: z.number().int().nonnegative().optional(),
    categoryId: z.string().uuid(),
    image: z.string().url().optional(),
});
export const updateProductSchema = createProductSchema.partial();
