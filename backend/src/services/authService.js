import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { emailOtpRepository } from "../repositories/emailOtpRepository.js";
import { emailService } from "./emailService.js";
import { AppError } from "../utils/AppError.js";

const refreshTokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;
const otpExpiresInMs = 10 * 60 * 1000;
const otpResendCooldownMs = 60 * 1000;
const maxOtpAttempts = 5;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

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
            emailVerifiedAt: user.emailVerifiedAt,
        },
        token,
        refreshToken,
    };
};

const issueOtp = async ({ user, purpose }) => {
    const activeOtp = await emailOtpRepository.findLatestActive({ userId: user.id, purpose });
    if (activeOtp && Date.now() - new Date(activeOtp.createdAt).getTime() < otpResendCooldownMs) {
        throw new AppError("Please wait before requesting another code", 429);
    }

    await emailOtpRepository.invalidateActive({ userId: user.id, purpose });
    const code = generateOtp();
    await emailOtpRepository.create({
        userId: user.id,
        purpose,
        codeHash: hashOtp(code),
        expiresAt: new Date(Date.now() + otpExpiresInMs),
    });
    await emailService.sendOtp({ to: user.email, code, purpose });
};

const verifyOtp = async ({ user, purpose, code }) => {
    const otp = await emailOtpRepository.findLatestActive({ userId: user.id, purpose });
    if (!otp || otp.attempts >= maxOtpAttempts) {
        throw new AppError("Invalid or expired code", 400);
    }

    if (hashOtp(code) !== otp.codeHash) {
        await emailOtpRepository.incrementAttempts(otp.id);
        throw new AppError("Invalid or expired code", 400);
    }

    const result = await emailOtpRepository.consume(otp.id);
    if (result.count !== 1) {
        throw new AppError("Invalid or expired code", 400);
    }
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

        await issueOtp({ user, purpose: "EMAIL_VERIFICATION" });
        return { message: "Registration successful. Check your email for a verification code." };
    },

    async login({ email, password }) {
        const normalizeEmail = email.toLowerCase().trim();
        const user = await userRepository.findAuthByEmail(normalizeEmail);
        if (!user || user.deletedAt) {
            throw new AppError("Invalid email or password", 401);
        }

        if (!user.emailVerifiedAt) {
            throw new AppError("Please verify your email before logging in", 403);
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

    async logout({ refreshToken, userId }) {
        if (refreshToken) {
          await refreshTokenRepository.revokeByHash(hashToken(refreshToken));
        }
    },

    async verifyEmail({ email, code }) {
        const user = await userRepository.findAuthByEmail(email.toLowerCase().trim());
        if (!user || user.deletedAt) {
            throw new AppError("Invalid or expired code", 400);
        }

        if (!user.emailVerifiedAt) {
            await verifyOtp({ user, purpose: "EMAIL_VERIFICATION", code });
            await userRepository.markEmailVerified(user.id);
        }

        return { message: "Email verified successfully" };
    },

    async resendVerification({ email }) {
        const user = await userRepository.findAuthByEmail(email.toLowerCase().trim());
        if (!user || user.deletedAt || user.emailVerifiedAt) {
            return { message: "If this account needs verification, a code has been sent." };
        }

        await issueOtp({ user, purpose: "EMAIL_VERIFICATION" });
        return { message: "If this account needs verification, a code has been sent." };
    },

    async forgotPassword({ email }) {
        const user = await userRepository.findAuthByEmail(email.toLowerCase().trim());
        if (user && !user.deletedAt && user.emailVerifiedAt) {
            try {
                await issueOtp({ user, purpose: "PASSWORD_RESET" });
            } catch (error) {
                if (!(error instanceof AppError) || error.statusCode !== 429) {
                    throw error;
                }
            }
        }

        return { message: "If an account exists for this email, a password reset code has been sent." };
    },

    async resetPassword({ email, code, password }) {
        const user = await userRepository.findAuthByEmail(email.toLowerCase().trim());
        if (!user || user.deletedAt) {
            throw new AppError("Invalid or expired code", 400);
        }

        await verifyOtp({ user, purpose: "PASSWORD_RESET", code });
        const hashedPassword = await bcrypt.hash(password, 10);
        await userRepository.update(user.id, { password: hashedPassword });
        await refreshTokenRepository.revokeAllForUser(user.id);
        return { message: "Password reset successfully. Please log in with your new password." };
    },
};
