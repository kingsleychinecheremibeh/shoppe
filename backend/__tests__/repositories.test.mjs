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
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = await import('../src/config/db.js');
const { categoryRepository } = await import('../src/repositories/categoryRepository.js');
const { userRepository } = await import('../src/repositories/userRepository.js');

describe('repositories', () => {
  beforeEach(() => jest.clearAllMocks());

  const publicUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    managerPermissions: true,
    createdAt: true,
    deletedAt: true,
  };

  test('categoryRepository delegates to prisma with expected filters', async () => {
    prisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Shoes', _count: { products: 2 } },
    ]);

    await expect(categoryRepository.findAll()).resolves.toEqual([
      { id: 'cat-1', name: 'Shoes', activeProductCount: 2 },
    ]);
    await categoryRepository.findById('cat-1');
    await categoryRepository.findBySlug('shoes');
    await categoryRepository.create({ name: 'Shoes' });
    await categoryRepository.update('cat-1', { name: 'Bags' });
    await categoryRepository.delete('cat-1');

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });
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
      select: publicUserSelect,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: publicUserSelect,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { name: 'Ada' },
      select: publicUserSelect,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Ada B' },
      select: publicUserSelect,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
