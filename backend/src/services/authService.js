import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { passwordResetRepository } from "../repositories/passwordResetRepository.js";
import { sendMail } from "../config/mailer.js";
import { logger } from "../utils/logger.js";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

const refreshTokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
const passwordResetMaxAgeMs = 30 * 60 * 1000;
const STORE_NAME = "Shoppe";

const buildResetUrl = (token) => {
    const url = new URL("/reset-password", process.env.FRONTEND_URL || "http://localhost:3000");
    url.searchParams.set("token", token);
    return url.toString();
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const generateAccessToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign(
        { userId: user.id, role: user.role, sessionId: user.sessionId },
        process.env.JWT_SECRET,
        { expiresIn: "15min" }
    );
};

const generateRefreshToken = (user) => {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
    }
    return jwt.sign(
        { userId: user.id, sessionId: user.sessionId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

const buildAuthPayload = async (user, sessionId) => {
    const session = sessionId
        ? { id: sessionId }
        : await refreshTokenRepository.createSession({
            userId: user.id,
        });
    const tokenUser = { ...user, sessionId: session.id };
    const token = generateAccessToken(tokenUser);
    const refreshToken = generateRefreshToken(tokenUser);

    await refreshTokenRepository.create({
        sessionId: session.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            managerPermissions: user.managerPermissions || [],
        },
        token,
        refreshToken,
    };
};

export const authService = {
    async register({ name, email, password }) {
        const normalizeEmail = email.toLowerCase().trim();
        const existingUser = await userRepository.findPublicByEmail(normalizeEmail);
        if (existingUser) {
            throw new AppError("User already exists", 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userRepository.create({
            name,
            email: normalizeEmail,
            password: hashedPassword,
        });

        return buildAuthPayload(user);
    },

    async login({ email, password }) {
        const normalizeEmail = email.toLowerCase().trim();
        const user = await userRepository.findAuthByEmail(normalizeEmail);
        if (!user || user.deletedAt) {
            throw new AppError("Invalid email or password", 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AppError("Invalid email or password", 401);
        }

        return buildAuthPayload(user);
    },

    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new AppError("Refresh token missing", 401);
        }

        if (!process.env.JWT_REFRESH_SECRET) {
            throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
        const storedToken = await refreshTokenRepository.findByHash(hashToken(refreshToken));
        const tokenHash = hashToken(refreshToken);
        if (!storedToken) {
            throw new AppError("Invalid or expired refresh token", 401);
        }

        if (storedToken.sessionId !== decoded.sessionId) {
            await refreshTokenRepository.revokeAllForUser(decoded.userId);
            throw new AppError("Invalid session", 401);
        }

        if (storedToken.revokedAt) {
            await refreshTokenRepository.revokeAllForUser(decoded.userId);
            throw new AppError("Token reuse detected. All sessions terminated.", 401);
        }

        const user = await userRepository.findById(decoded.userId);

        if (!user || user.deletedAt) {
            throw new AppError("Not authorized, user not found", 401);
        }

        await refreshTokenRepository.revokeByHash(tokenHash);
        return buildAuthPayload(user, storedToken.sessionId);
    },

    /**
     * Starts a password reset. Always resolves the same way whether or not the email exists,
     * so the endpoint can't be used to discover which emails have accounts.
     */
    async requestPasswordReset(email) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await userRepository.findAuthByEmail(normalizedEmail);
        if (!user || user.deletedAt) {
            return;
        }

        const token = crypto.randomBytes(32).toString("hex");
        await passwordResetRepository.invalidateForUser(user.id);
        await passwordResetRepository.create({
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + passwordResetMaxAgeMs),
        });

        const resetUrl = buildResetUrl(token);
        try {
            await sendMail({
                to: user.email,
                subject: `Reset your ${STORE_NAME} password`,
                text: [
                    `Hi ${user.name || "there"},`,
                    "",
                    `We received a request to reset your ${STORE_NAME} password. Use the link below within 30 minutes:`,
                    resetUrl,
                    "",
                    "If you didn't ask for this, you can ignore this email. Your password won't change.",
                ].join("\n"),
                html: `<p>Hi ${escapeHtml(user.name || "there")},</p>
<p>We received a request to reset your ${STORE_NAME} password. This link works for 30 minutes:</p>
<p><a href="${resetUrl}">Reset my password</a></p>
<p>If you didn't ask for this, you can ignore this email. Your password won't change.</p>`,
            });
        } catch (err) {
            // Don't reveal delivery problems to the requester; log for the team instead.
            logger.error("Password reset email failed to send", { error: err.message });
        }
    },

    /** Completes a reset: sets the new password, consumes the token and signs out all sessions. */
    async resetPassword({ token, password }) {
        const record = await passwordResetRepository.findValidByHash(hashToken(token));
        if (!record) {
            throw new AppError("This reset link is invalid or has expired. Please request a new one.", 400);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const changed = await passwordResetRepository.consumeAndSetPassword({
            tokenId: record.id,
            userId: record.userId,
            passwordHash,
        });
        if (!changed) {
            throw new AppError("This reset link is invalid or has expired. Please request a new one.", 400);
        }

        await refreshTokenRepository.revokeAllForUser(record.userId);
    },

    async logout({ refreshToken, userId }) {
        if (refreshToken) {
          await refreshTokenRepository.revokeByHash(hashToken(refreshToken));
        }
    },
};
