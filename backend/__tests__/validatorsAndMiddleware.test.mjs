import { jest } from "@jest/globals";
import { validate } from '../src/middleware/validateMiddleware.js';
import { registerSchema, loginSchema } from '../src/validators/authValidator.js';
import { addressSchema } from '../src/validators/addressValidators.js';

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('validate middleware and zod validators', () => {
  test('passes parsed body to next when schema succeeds', () => {
    const req = { body: { email: 'ada@example.com', password: 'secret1' } };
    const res = makeRes();
    const next = jest.fn();

    validate(loginSchema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({ email: 'ada@example.com', password: 'secret1' });
  });

  test('returns validation errors when schema fails', () => {
    const req = { body: { email: 'not-an-email', password: '123' } };
    const res = makeRes();
    const next = jest.fn();

    validate(loginSchema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Please check the highlighted fields and try again.',
      errors: expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' }),
      ]),
    });
  });

  test('register schema accepts valid registration data', () => {
    expect(registerSchema.safeParse({ name: 'Ada', email: 'ada@example.com', password: 'secret1' }).success).toBe(true);
  });

  test('address schema trims and validates address data', () => {
    const result = addressSchema.safeParse({
      fullName: ' Ada Lovelace ',
      phone: '1234567',
      street: ' 1 Byte Street ',
      city: ' Lagos ',
      state: ' Lagos ',
      country: ' Nigeria ',
    });

    expect(result.success).toBe(true);
    expect(result.data.fullName).toBe('Ada Lovelace');
  });
});
