import express from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser, getCurrentUser, logoutUser, refreshAccessToken, getCsrfToken } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { registerSchema, loginSchema } from "../validators/authValidator.js";

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
router.get("/csrf-token", getCsrfToken);
router.post("/register", registerLimiter, validate(registerSchema), registerUser);
router.post("/login", loginLimiter, validate(loginSchema), loginUser);
router.post("/refresh-token", refreshLimiter, refreshAccessToken);
// No `protect`: logging out must still work after the 15-minute access token has expired.
// The controller only revokes the refresh token from the cookie; CSRF and origin checks still apply.
router.post("/logout", logoutUser);
router.get("/me", protect, getCurrentUser);

export default router;
