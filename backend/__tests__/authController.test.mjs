import { jest } from "@jest/globals";

const authService = {
  register: jest.fn(),
  login: jest.fn(),
  refreshAccessToken: jest.fn(),
  logout: jest.fn(),
};

await jest.unstable_mockModule('../src/services/authService.js', () => ({ authService }));

const { registerUser, loginUser, getCurrentUser, logoutUser, refreshAccessToken } = await import('../src/controllers/authController.js');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('authController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('registerUser', () => {
    test('should register user and return 201', async () => {
      const req = { body: { name: 'Test User', email: 'test@example.com', password: 'pass123' } };
      const res = makeRes();
      const next = jest.fn();
      authService.register.mockResolvedValue({ user: { id: '1' }, token: 'tok', refreshToken: 'refresh-tok' });

      await registerUser(req, res, next);

      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'tok', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-tok', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.json).toHaveBeenCalledWith({ user: { id: '1' } });
    });

    test('should forward errors to next when registration fails', async () => {
      const req = { body: { name: 'Test', email: 'test@example.com', password: 'pass123' } };
      const res = makeRes();
      const next = jest.fn();
      const error = new Error('User already exists');
      authService.register.mockRejectedValue(error);

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    test('should login and set auth cookie', async () => {
      const req = { body: { email: 'test@example.com', password: 'pass123' } };
      const res = makeRes();
      const next = jest.fn();
      authService.login.mockResolvedValue({ user: { id: '1' }, token: 'tok', refreshToken: 'refresh-tok' });

      await loginUser(req, res, next);

      expect(authService.login).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'tok', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-tok', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.json).toHaveBeenCalledWith({ user: { id: '1' } });
    });

    test('should forward 401 error to next for wrong credentials', async () => {
      const req = { body: { email: 'test@example.com', password: 'wrong' } };
      const res = makeRes();
      const next = jest.fn();
      const error = new Error('Invalid email or password');
      authService.login.mockRejectedValue(error);

      await loginUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    test('should return the current authenticated user', async () => {
      const req = { user: { id: '1', name: 'Test', email: 'test@example.com', role: 'USER' } };
      const res = makeRes();
      const next = jest.fn();

      await getCurrentUser(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ user: req.user });
    });
  });

  describe('refreshAccessToken', () => {
    test('should rotate cookies and return user', async () => {
      const req = { cookies: { refresh_token: 'old-refresh' } };
      const res = makeRes();
      const next = jest.fn();
      authService.refreshAccessToken.mockResolvedValue({ user: { id: '1' }, token: 'new-tok', refreshToken: 'new-refresh' });

      await refreshAccessToken(req, res, next);

      expect(authService.refreshAccessToken).toHaveBeenCalledWith('old-refresh');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith('access_token', 'new-tok', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'new-refresh', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.json).toHaveBeenCalledWith({ user: { id: '1' } });
    });
  });

  describe('logoutUser', () => {
    test('should revoke refresh token and clear auth cookies', async () => {
      const req = { cookies: { refresh_token: 'refresh-tok' } };
      const res = makeRes();
      const next = jest.fn();

      await logoutUser(req, res, next);

      expect(authService.logout).toHaveBeenCalledWith('refresh-tok');
      expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});
