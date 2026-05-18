import { z } from "zod";

const nonEmptyUpdate = (data) => Object.keys(data).length > 0;

export const createProductSchema = z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().min(5),
    price: z.coerce.number().positive(),
    stock: z.coerce.number().int().nonnegative().optional(),
    categoryId: z.string().uuid(),
    image: z.string().trim().url().optional().nullable(),
});

export const updateProductSchema = createProductSchema
    .partial()
    .refine(nonEmptyUpdate, "At least one field is required");
