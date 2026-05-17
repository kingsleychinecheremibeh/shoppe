import { jest } from "@jest/globals";

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = await import('../src/config/db.js');
const { categoryRepository } = await import('../src/repositories/categoryRepository.js');
const { userRepository } = await import('../src/repositories/userRepository.js');

describe('repositories', () => {
  beforeEach(() => jest.clearAllMocks());

  test('categoryRepository delegates to prisma with expected filters', async () => {
    await categoryRepository.findAll();
    await categoryRepository.findById('cat-1');
    await categoryRepository.findBySlug('shoes');
    await categoryRepository.create({ name: 'Shoes' });
    await categoryRepository.update('cat-1', { name: 'Bags' });
    await categoryRepository.delete('cat-1');

    expect(prisma.category.findMany).toHaveBeenCalledWith({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' } });
    expect(prisma.category.findFirst).toHaveBeenCalledWith({ where: { id: 'cat-1', isDeleted: false }, include: { products: true } });
    expect(prisma.category.findFirst).toHaveBeenCalledWith({ where: { slug: 'shoes', isDeleted: false } });
    expect(prisma.category.create).toHaveBeenCalledWith({ data: { name: 'Shoes' } });
    expect(prisma.category.update).toHaveBeenCalledWith({ where: { id: 'cat-1' }, data: { name: 'Bags' } });
    expect(prisma.category.update).toHaveBeenCalledWith({ where: { id: 'cat-1' }, data: { isDeleted: true } });
  });

  test('userRepository delegates to prisma with safe selects', async () => {
    await userRepository.findByEmail('ada@example.com');
    await userRepository.findById('user-1');
    await userRepository.create({ name: 'Ada' });
    await userRepository.update('user-1', { name: 'Ada B' });
    await userRepository.delete('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'ada@example.com' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { name: 'Ada' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Ada B' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, deletedAt: true },
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
