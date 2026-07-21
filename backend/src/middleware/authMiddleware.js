import jwt from "jsonwebtoken";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
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

    const activeSession = await refreshTokenRepository.findActiveSession({
        sessionId: decoded.sessionId,
        userId: decoded.userId,
    });

    if (!activeSession) {
        throw new AppError("Not authorized, session revoked", 401);
    }

    req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        managerPermissions: user.managerPermissions || [],
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
    };
    next();
});

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") return next();
    next(new AppError("Access denied. Admin only.", 403));
};

export const staffWithPermission = (permission) => (req, res, next) => {
    if (!req.user) {
        return next(new AppError("Please log in to continue.", 401));
    }

    if (req.user.role === "ADMIN") {
        return next();
    }

    if (
        req.user.role === "MANAGER" &&
        Array.isArray(req.user.managerPermissions) &&
        req.user.managerPermissions.includes(permission)
    ) {
        return next();
    }

    next(new AppError("You do not have permission to perform this action.", 403));
};
