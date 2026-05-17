import { jest } from "@jest/globals";
import jwt from 'jsonwebtoken';

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
  },
}));

process.env.JWT_SECRET = 'test-secret';

const { prisma } = await import('../src/config/db.js');
const { protect, adminOnly } = await import('../src/middleware/authMiddleware.js');

describe('protect middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { cookies: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('should call next if token is valid and user exists', async () => {
    const token = jwt.sign({ userId: '123' }, 'test-secret');
    req.cookies.access_token = token;
    prisma.user.findUnique.mockResolvedValue({ id: '123', name: 'Test User', email: 'test@example.com', role: 'USER', deletedAt: null });

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ id: '123' });
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should call next with 401 AppError if no token', async () => {
    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Not authorized, no token' }));
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should call next with 401 AppError if token is invalid', async () => {
    req.cookies.access_token = 'invalid-token';

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Invalid token' }));
  });

  test('should call next with 401 AppError if user not found', async () => {
    const token = jwt.sign({ userId: '123' }, 'test-secret');
    req.cookies.access_token = token;
    prisma.user.findUnique.mockResolvedValue(null);

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Not authorized, user not found' }));
  });

  test('should call next with 401 AppError if user is soft-deleted', async () => {
    const token = jwt.sign({ userId: '123' }, 'test-secret');
    req.cookies.access_token = token;
    prisma.user.findUnique.mockResolvedValue({ id: '123', deletedAt: new Date() });

    await protect(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Not authorized, user not found' }));
  });
});

describe('adminOnly middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  test('should call next if user is admin', () => {
    req.user = { role: 'ADMIN' };
    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should call next with 403 AppError if user is not admin', () => {
    req.user = { role: 'USER' };
    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403, message: 'Access denied. Admin only.' }));
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should call next with 403 AppError if no user on request', () => {
    adminOnly(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
