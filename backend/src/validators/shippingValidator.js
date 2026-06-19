import { z } from "zod";
import { sanitizedString } from "../utils/sanitize.js";

export const shippingMethodSchema = z.object({
    name: sanitizedString(z.string().min(2)),
    description: sanitizedString(z.string()).optional(),
    price: z.coerce.number().min(0),
    estimatedDays: sanitizedString(z.string()).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
})
