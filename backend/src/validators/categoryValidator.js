import { z } from "zod";
export const categorySchema = z.object({
    name: z.string().trim().min(2).max(80),
    image: z.string()
        .trim()
        .refine(val => val.startsWith("/") || z.string().url().safeParse(val).success, {
            message: "Image must be a valid relative path or absolute URL"
        })
        .optional()
        .nullable(),
});