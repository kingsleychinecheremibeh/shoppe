import { jest } from "@jest/globals";
import crypto from "crypto";

const userRepository = { findAuthByEmail: jest.fn(), findById: jest.fn() };
const refreshTokenRepository = { revokeAllForUser: jest.fn() };
const passwordResetRepository = {
  invalidateForUser: jest.fn(),
  create: jest.fn(),
  findValidByHash: jest.fn(),
  consumeAndSetPassword: jest.fn(),
};
const sendMail = jest.fn();

await jest.unstable_mockModule("../src/repositories/userRepository.js", () => ({ userRepository }));
await jest.unstable_mockModule("../src/repositories/refreshTokenRepository.js", () => ({ refreshTokenRepository }));
await jest.unstable_mockModule("../src/repositories/passwordResetRepository.js", () => ({ passwordResetRepository }));
await jest.unstable_mockModule("../src/config/mailer.js", () => ({ sendMail, isMailerConfigured: () => true }));

process.env.FRONTEND_URL = "https://shop.example";

const { authService } = await import("../src/services/authService.js");
const { resetPasswordSchema, forgotPasswordSchema, registerSchema } = await import("../src/validators/authValidator.js");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

describe("password reset", () => {
  beforeEach(() => jest.clearAllMocks());

  test("emails a single-use link and stores only a hash of the token", async () => {
    userRepository.findAuthByEmail.mockResolvedValue({ id: "user-1", email: "ada@example.com", name: "Ada" });

    await authService.requestPasswordReset("  Ada@Example.com ");

    expect(userRepository.findAuthByEmail).toHaveBeenCalledWith("ada@example.com");
    expect(passwordResetRepository.invalidateForUser).toHaveBeenCalledWith("user-1");

    const { to, text, subject } = sendMail.mock.calls[0][0];
    expect(to).toBe("ada@example.com");
    expect(subject).toMatch(/reset/i);
    const token = text.match(/reset-password\?token=([a-f0-9]{64})/)[1];

    const stored = passwordResetRepository.create.mock.calls[0][0];
    expect(stored.userId).toBe("user-1");
    expect(stored.tokenHash).toBe(sha256(token));
    expect(stored.tokenHash).not.toBe(token);
    const minutesValid = (stored.expiresAt.getTime() - Date.now()) / 60000;
    expect(minutesValid).toBeGreaterThan(29);
    expect(minutesValid).toBeLessThanOrEqual(30);
  });

  test("does nothing (and reveals nothing) for unknown or deleted accounts", async () => {
    userRepository.findAuthByEmail.mockResolvedValueOnce(null);
    await expect(authService.requestPasswordReset("nobody@example.com")).resolves.toBeUndefined();

    userRepository.findAuthByEmail.mockResolvedValueOnce({ id: "user-2", email: "x@example.com", deletedAt: new Date() });
    await expect(authService.requestPasswordReset("x@example.com")).resolves.toBeUndefined();

    expect(passwordResetRepository.create).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("does not fail the request when the email provider errors", async () => {
    userRepository.findAuthByEmail.mockResolvedValue({ id: "user-1", email: "ada@example.com", name: "Ada" });
    sendMail.mockRejectedValueOnce(new Error("SMTP down"));

    await expect(authService.requestPasswordReset("ada@example.com")).resolves.toBeUndefined();
  });

  test("escapes the user's name in the HTML email", async () => {
    userRepository.findAuthByEmail.mockResolvedValue({ id: "user-1", email: "a@example.com", name: "<b>Ada</b>" });

    await authService.requestPasswordReset("a@example.com");

    expect(sendMail.mock.calls[0][0].html).toContain("&lt;b&gt;Ada&lt;/b&gt;");
  });

  test("resets the password, consumes the token and signs out every session", async () => {
    const token = "a".repeat(64);
    passwordResetRepository.findValidByHash.mockResolvedValue({ id: "tok-1", userId: "user-1" });
    passwordResetRepository.consumeAndSetPassword.mockResolvedValue(true);

    await authService.resetPassword({ token, password: "new-secret-1" });

    expect(passwordResetRepository.findValidByHash).toHaveBeenCalledWith(sha256(token));
    const { tokenId, userId, passwordHash } = passwordResetRepository.consumeAndSetPassword.mock.calls[0][0];
    expect(tokenId).toBe("tok-1");
    expect(userId).toBe("user-1");
    expect(passwordHash).toMatch(/^\$2[aby]\$/);
    expect(passwordHash).not.toContain("new-secret-1");
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
  });

  test("rejects expired, unknown or already-used links", async () => {
    passwordResetRepository.findValidByHash.mockResolvedValueOnce(null);
    await expect(authService.resetPassword({ token: "b".repeat(64), password: "secret-12" })).rejects.toMatchObject({
      statusCode: 400,
    });

    passwordResetRepository.findValidByHash.mockResolvedValueOnce({ id: "tok-1", userId: "user-1" });
    passwordResetRepository.consumeAndSetPassword.mockResolvedValueOnce(false);
    await expect(authService.resetPassword({ token: "b".repeat(64), password: "secret-12" })).rejects.toThrow(
      "invalid or has expired"
    );
    expect(refreshTokenRepository.revokeAllForUser).not.toHaveBeenCalled();
  });

  test("validates reset input", () => {
    expect(resetPasswordSchema.safeParse({ token: "a".repeat(64), password: "secret1" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "../etc", password: "secret1" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "a".repeat(64), password: "x".repeat(73) }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ name: "Ada", email: "a@b.co", password: "x".repeat(73) }).success).toBe(false);
  });
});
