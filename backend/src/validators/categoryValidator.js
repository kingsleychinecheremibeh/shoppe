import { z } from "zod";
export const categorySchema = z.object({
    name: z.string().trim().min(2).max(80),
    image: z.string().url().optional().nullable(),
});
