import express from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getCurrentUser, logoutUser, refreshAccessToken, getCsrfToken, verifyEmail, resendVerification, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { registerSchema, loginSchema, verifyEmailSchema, resendVerificationSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/authValidator.js";

const router = express.Router();

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many auth registration attempts, please try again later.",
});


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts, please try again in an 15 minutes.",
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many token refresh attempts, please try again in an 15 minutes.",
});
const otpRequestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many code requests, please try again later.",
});

const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many verification attempts, please try again later.",
});
router.get("/csrf-token", getCsrfToken);
router.post("/register", registerLimiter, validate(registerSchema), registerUser);
router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/refresh-token", refreshLimiter, refreshAccessToken);
router.post("/verify-email", otpVerifyLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-verification", otpRequestLimiter, validate(resendVerificationSchema), resendVerification);
router.post("/forgot-password", otpRequestLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", otpVerifyLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getCurrentUser);

export default router;
