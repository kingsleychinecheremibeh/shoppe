import { z } from "zod";
import { sanitizedString } from "../utils/sanitize.js";

export const registerSchema = z.object({
    name: sanitizedString(z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")),
    email: z
        .string()
        .email("Please provide a valid email"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
});

export const loginSchema = z.object({
    email: z
        .string()
        .email("Please provide a valid email"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
});

export const refreshSchema = z.object({
    refreshToken: z.string().optional(),
});
