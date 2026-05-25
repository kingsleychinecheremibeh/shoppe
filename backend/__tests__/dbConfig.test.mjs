import { jest } from "@jest/globals";

const prismaPg = jest.fn();
const prismaClient = jest.fn();

await jest.unstable_mockModule('@prisma/adapter-pg', () => ({ PrismaPg: prismaPg }));
await jest.unstable_mockModule('@prisma/client', () => ({ PrismaClient: prismaClient }));
await jest.unstable_mockModule('pg', () => ({
  default: {
    Pool: jest.fn((options) => ({ options })),
  },
}));

process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/shop_test';

await import('../src/config/db.js');

describe('db config', () => {
  test('creates Prisma adapter and client from DATABASE_URL', () => {
    expect(prismaPg).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          connectionString: 'postgresql://user:pass@localhost:5432/shop_test',
        }),
      })
    );
    expect(prismaClient).toHaveBeenCalledWith({ adapter: expect.any(Object) });
  });
});
