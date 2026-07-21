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
});

export const loginSchema = z.object({
    email: emailSchema,
    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
});

export const refreshSchema = z.object({
    refreshToken: z.string().optional(),
});

const emailSchema = z.string().email("Please provide a valid email");
const otpSchema = z.string().regex(/^\d{6}$/, "Code must be six digits");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export const verifyEmailSchema = z.object({ email: emailSchema, code: otpSchema });
export const resendVerificationSchema = z.object({ email: emailSchema });
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ email: emailSchema, code: otpSchema, password: passwordSchema });
