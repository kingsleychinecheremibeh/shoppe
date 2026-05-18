import { jest } from "@jest/globals";

const categoryRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

await jest.unstable_mockModule('../src/repositories/categoryRepository.js', () => ({ categoryRepository }));

const { categoryService } = await import('../src/services/categoryService.js');

describe('categoryService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('gets categories from repository', async () => {
    categoryRepository.findAll.mockResolvedValue([{ id: 'cat-1' }]);

    await expect(categoryService.getCategories()).resolves.toEqual([{ id: 'cat-1' }]);
  });

  test('creates a category with a unique slug', async () => {
    categoryRepository.findBySlug.mockResolvedValue(null);
    categoryRepository.create.mockResolvedValue({ id: 'cat-1', slug: 'running-shoes' });

    await categoryService.createCategory('Running Shoes');

    expect(categoryRepository.create).toHaveBeenCalledWith({ name: 'Running Shoes', slug: 'running-shoes', image: null });
  });

  test('increments slug when duplicate exists', async () => {
    categoryRepository.findBySlug
      .mockResolvedValueOnce({ id: 'other', slug: 'shoes' })
      .mockResolvedValueOnce(null);
    categoryRepository.create.mockResolvedValue({ id: 'cat-1', slug: 'shoes-1' });

    await categoryService.createCategory('Shoes');

    expect(categoryRepository.create).toHaveBeenCalledWith({ name: 'Shoes', slug: 'shoes-1', image: null });
  });

  test('rejects missing category name', async () => {
    await expect(categoryService.createCategory('')).rejects.toThrow('Name is required');
  });

  test('updates an existing category', async () => {
    categoryRepository.findById.mockResolvedValue({ id: 'cat-1', products: [] });
    categoryRepository.findBySlug.mockResolvedValue({ id: 'cat-1' });
    categoryRepository.update.mockResolvedValue({ id: 'cat-1', name: 'Bags' });

    await categoryService.updateCategory('cat-1', 'Bags');

    expect(categoryRepository.update).toHaveBeenCalledWith('cat-1', { name: 'Bags', slug: 'bags', image: null });
  });

  test('does not update a missing category', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(categoryService.updateCategory('missing', 'Bags')).rejects.toThrow('Category not found');
  });

  test('does not delete a category with products', async () => {
    categoryRepository.findById.mockResolvedValue({ id: 'cat-1', products: [{ id: 'prod-1' }] });

    await expect(categoryService.deleteCategory('cat-1')).rejects.toThrow('Cannot delete category with products');
  });

  test('deletes an empty category', async () => {
    categoryRepository.findById.mockResolvedValue({ id: 'cat-1', products: [] });
    categoryRepository.delete.mockResolvedValue({ id: 'cat-1' });

    await categoryService.deleteCategory('cat-1');

    expect(categoryRepository.delete).toHaveBeenCalledWith('cat-1');
  });
});
