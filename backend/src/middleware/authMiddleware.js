import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authCookieName } from "../utils/authCookie.js";

export const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.[authCookieName];

    if (!token) {
        throw new AppError("Not authorized, no token", 401);
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.sessionId) {
            throw new AppError("Invalid session", 401);
        }
    } catch (err) {
        if (err.statusCode) {
            throw err;
        }

        if (err.name === "TokenExpiredError") {
            throw new AppError("Token expired", 401);
        }

        if (err.name === "JsonWebTokenError") {
            throw new AppError("Invalid token", 401);
        }

        throw new AppError("Authentication failed", 401);
    }

    const user = await userRepository.findById(decoded.userId);

    if (!user || user.deletedAt) {
        throw new AppError("Not authorized, user not found", 401);
    }

    req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };
    next();
});

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") return next();
    next(new AppError("Access denied. Admin only.", 403));
};
