import { authService } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshAccessToken(req.cookies?.[refreshCookieName]);
    sendAuthResponse(res, 200, result);
});

export const registerUser = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    sendAuthResponse(res, 201, result);
});

export const loginUser = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    sendAuthResponse(res, 200, result);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    res.json({ user: req.user });
});

export const logoutUser = asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.[refreshCookieName]);

    res
        .clearCookie(authCookieName, getClearAuthCookieOptions())
        .clearCookie(refreshCookieName, getClearRefreshTokenCookieOptions())
        .json({ message: "Logged out successfully" });
});
