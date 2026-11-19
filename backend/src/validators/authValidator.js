import { z } from "zod";
import { sanitizedString } from "../utils/sanitize.js";

const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email");

export const registerSchema = z.object({
    name: sanitizedString(z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters")),
    email: emailSchema,
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(72, "Password must be at most 72 characters"),
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
});

const passwordSchema = z
    .string()
    .min(6, "Password must be at least 6 characters")
    // bcrypt only uses the first 72 bytes; longer inputs also cost CPU for nothing.
    .max(72, "Password must be at most 72 characters");

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/, "This reset link is invalid or has expired."),
    password: passwordSchema,
});

export const refreshSchema = z.object({
    refreshToken: z.string().optional(),
});
