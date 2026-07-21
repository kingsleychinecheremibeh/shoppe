import { jest } from "@jest/globals";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const refreshTokenRepository = {
  createSession: jest.fn(), create: jest.fn(), revokeByHash: jest.fn(), revokeAllForUser: jest.fn(),
};
const userRepository = {
  findPublicByEmail: jest.fn(), create: jest.fn(), findAuthByEmail: jest.fn(), update: jest.fn(), markEmailVerified: jest.fn(),
};
const emailOtpRepository = {
  findLatestActive: jest.fn(), invalidateActive: jest.fn(), create: jest.fn(), incrementAttempts: jest.fn(), consume: jest.fn(),
};
const emailService = { sendOtp: jest.fn() };

await jest.unstable_mockModule('../src/repositories/refreshTokenRepository.js', () => ({ refreshTokenRepository }));
await jest.unstable_mockModule('../src/repositories/userRepository.js', () => ({ userRepository }));
await jest.unstable_mockModule('../src/repositories/emailOtpRepository.js', () => ({ emailOtpRepository }));
await jest.unstable_mockModule('../src/services/emailService.js', () => ({ emailService }));

const { authService } = await import('../src/services/authService.js');

const user = {
  id: 'user-1', name: 'Ada', email: 'ada@example.com', role: 'USER', managerPermissions: [], password: 'old-hash', emailVerifiedAt: new Date(),
};

describe('authService email OTP flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailOtpRepository.findLatestActive.mockResolvedValue(null);
    emailOtpRepository.invalidateActive.mockResolvedValue({ count: 0 });
    emailOtpRepository.create.mockResolvedValue({ id: 'otp-1' });
    emailOtpRepository.consume.mockResolvedValue({ count: 1 });
  });

  test('registers an unverified account and sends a verification OTP without a session', async () => {
    const newUser = { ...user, emailVerifiedAt: null };
    userRepository.findPublicByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(newUser);

    await expect(authService.register({ name: 'Ada', email: ' ADA@EXAMPLE.COM ', password: 'secret1' }))
      .resolves.toEqual({ message: 'Registration successful. Check your email for a verification code.' });

    expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'ada@example.com', password: expect.any(String) }));
    expect(emailOtpRepository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', purpose: 'EMAIL_VERIFICATION', codeHash: expect.any(String), expiresAt: expect.any(Date) }));
    expect(emailService.sendOtp).toHaveBeenCalledWith(expect.objectContaining({ to: 'ada@example.com', purpose: 'EMAIL_VERIFICATION', code: expect.stringMatching(/^\d{6}$/) }));
    expect(refreshTokenRepository.createSession).not.toHaveBeenCalled();
  });

  test('blocks login for unverified users', async () => {
    userRepository.findAuthByEmail.mockResolvedValue({ ...user, emailVerifiedAt: null });

    await expect(authService.login({ email: user.email, password: 'secret1' }))
      .rejects.toMatchObject({ statusCode: 403, message: 'Please verify your email before logging in' });
  });

  test('rejects an incorrect OTP and records the failed attempt', async () => {
    userRepository.findAuthByEmail.mockResolvedValue({ ...user, emailVerifiedAt: null });
    emailOtpRepository.findLatestActive.mockResolvedValue({ id: 'otp-1', attempts: 0, codeHash: crypto.createHash('sha256').update('123456').digest('hex') });

    await expect(authService.verifyEmail({ email: user.email, code: '654321' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(emailOtpRepository.incrementAttempts).toHaveBeenCalledWith('otp-1');
    expect(userRepository.markEmailVerified).not.toHaveBeenCalled();
  });

  test('resets the password with a valid OTP and revokes all sessions', async () => {
    userRepository.findAuthByEmail.mockResolvedValue(user);
    emailOtpRepository.findLatestActive.mockResolvedValue({ id: 'otp-1', attempts: 0, codeHash: crypto.createHash('sha256').update('123456').digest('hex') });

    await expect(authService.resetPassword({ email: user.email, code: '123456', password: 'newsecret1' }))
      .resolves.toEqual({ message: 'Password reset successfully. Please log in with your new password.' });

    const [, update] = userRepository.update.mock.calls[0];
    expect(await bcrypt.compare('newsecret1', update.password)).toBe(true);
    expect(emailOtpRepository.consume).toHaveBeenCalledWith('otp-1');
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith('user-1');
  });

  test('returns a neutral response when a reset code is still in its cooldown', async () => {
    userRepository.findAuthByEmail.mockResolvedValue(user);
    emailOtpRepository.findLatestActive.mockResolvedValue({ id: 'otp-1', createdAt: new Date(), attempts: 0 });

    await expect(authService.forgotPassword({ email: user.email }))
      .resolves.toEqual({ message: 'If an account exists for this email, a password reset code has been sent.' });
    expect(emailService.sendOtp).not.toHaveBeenCalled();
  });
});
