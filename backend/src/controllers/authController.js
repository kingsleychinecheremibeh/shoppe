import { authService } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import {
    authCookieName,
    getAuthCookieOptions,
    getClearAuthCookieOptions,
    getClearRefreshTokenCookieOptions,
    refreshCookieName,
    getRefreshTokenCookieOptions
} from "../utils/authCookie.js";

const sendAuthResponse = (res, statusCode, result) => {
    const { token, refreshToken, user } = result;

    res
        .status(statusCode)
        .cookie(authCookieName, token, getAuthCookieOptions())
        .cookie(refreshCookieName, refreshToken, getRefreshTokenCookieOptions())
        .json({ user });
};

export const getCsrfToken = asyncHandler(async (req, res) => {
    res.status(200).json({ csrfToken: req.csrfToken() });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[refreshCookieName];

    if (!refreshToken) {
        throw new AppError("Refresh token missing", 401);
    }

    const result = await authService.refreshAccessToken(refreshToken);

    return sendAuthResponse(res, 200, result);
});

export const registerUser = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
});

export const loginUser = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    sendAuthResponse(res, 200, result);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    res.json({ user: req.user });
});

export const logoutUser = asyncHandler(async (req, res) => {
    await authService.logout({
        refreshToken: req.cookies?.[refreshCookieName],
    });

    res
        .clearCookie(authCookieName, getClearAuthCookieOptions())
        .clearCookie(refreshCookieName, getClearRefreshTokenCookieOptions())
        .json({ message: "Logged out successfully" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const result = await authService.verifyEmail(req.body);
    res.status(200).json(result);
});

export const resendVerification = asyncHandler(async (req, res) => {
    const result = await authService.resendVerification(req.body);
    res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body);
    res.status(200).json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body);
    res.status(200).json(result);
});
