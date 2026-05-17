import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";

const refreshTokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const generateAccessToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "15min" }
    );
};

const generateRefreshToken = (user) => {
    if (!process.env.JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
    }
    return jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

const buildAuthPayload = async (user) => {
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await refreshTokenRepository.create({
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token,
        refreshToken,
    };
};

export const authService = {
    async register({ name, email, password }) {
        const normalizeEmail = email.toLowerCase().trim();
        const existingUser = await userRepository.findByEmail(normalizeEmail);
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
        const user = await userRepository.findAuthUserByEmail(normalizeEmail);
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

        const tokenHash = hashToken(refreshToken);
        const storedToken = await refreshTokenRepository.findValidByHash(tokenHash);

        if (!storedToken || storedToken.userId !== decoded.userId) {
            throw new AppError("Invalid or expired refresh token", 401);
        }

        const user = await userRepository.findById(decoded.userId);

        if (!user || user.deletedAt) {
            throw new AppError("Not authorized, user not found", 401);
        }

        await refreshTokenRepository.revokeByHash(tokenHash);
        return buildAuthPayload(user);
    },

    async logout(refreshToken) {
        if (!refreshToken) return;
        await refreshTokenRepository.revokeByHash(hashToken(refreshToken));
    },
};
