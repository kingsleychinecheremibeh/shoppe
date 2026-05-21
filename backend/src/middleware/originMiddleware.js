import { AppError } from "../utils/AppError.js";
import { authCookieName, refreshCookieName } from "../utils/authCookie.js";

const normalizeOrigin = (origin) => {
    if (!origin) return null;
    try {
        return new URL(origin).origin;
    } catch {
        return origin.replace(/\/$/, "");
    }
};

const allowedOrigins = new Set(
    [
        process.env.FRONTEND_URL,
        process.env.CORS_ORIGIN,
        ...(process.env.CORS_ORIGINS || "").split(","),
        "http://localhost:3000",
    ]
        .map((origin) => normalizeOrigin(origin?.trim()))
        .filter(Boolean)
);

const hasAuthCookie = (req) => {
    const cookieHeader = req.headers.cookie || "";
    return cookieHeader.includes(`${authCookieName}=`) || cookieHeader.includes(`${refreshCookieName}=`);
};

export const requireAllowedOrigin = (req, res, next) => {
    const method = req.method.toUpperCase();

    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
        return next();
    }

    if (req.path.includes("/payment/stripe-webhook") || req.path.includes("/payment/paystack-webhook")) {
        return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    if (origin && allowedOrigins.has(normalizeOrigin(origin))) {
        return next();
    }

    if (referer) {
        try {
            const refererOrigin = new URL(referer).origin;
            if (allowedOrigins.has(normalizeOrigin(refererOrigin))) {
                return next();
            }
        } catch {
            // Fall through to the rejection below.
        }
    }

    if (!origin && !referer && !hasAuthCookie(req)) {
        return next();
    }

    return next(new AppError("Invalid request origin", 403));
};

