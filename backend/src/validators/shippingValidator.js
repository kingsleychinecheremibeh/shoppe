import { z } from "zod";

export const shippingMethodSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    estimatedDays: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
})