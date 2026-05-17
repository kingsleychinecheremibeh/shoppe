import { jest } from "@jest/globals";

const productRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  delete: jest.fn(),
  findCategoryById: jest.fn(),
};

await jest.unstable_mockModule('../src/repositories/productRepository.js', () => ({ productRepository }));

const { productService } = await import('../src/services/productService.js');

describe('productService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    const validData = {
      name: 'Sneaker',
      description: 'A great shoe',
      price: 99.99,
      stock: 10,
      categoryId: 'cat-1',
    };

    test('creates a product with a generated slug', async () => {
      productRepository.findCategoryById.mockResolvedValue({ id: 'cat-1' });
      productRepository.create.mockResolvedValue({ id: 'prod-1', slug: 'sneaker' });

      await productService.create(validData);

      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Sneaker', slug: 'sneaker', price: 99.99, stock: 10 })
      );
    });

    test('throws 400 if name is missing', async () => {
      await expect(productService.create({ ...validData, name: '' }))
        .rejects.toThrow('Name, description, and category are required');
    });

    test('throws 400 if description is missing', async () => {
      await expect(productService.create({ ...validData, description: '' }))
        .rejects.toThrow('Name, description, and category are required');
    });

    test('throws 400 if categoryId is missing', async () => {
      await expect(productService.create({ ...validData, categoryId: '' }))
        .rejects.toThrow('Name, description, and category are required');
    });

    test('throws 400 if category is soft-deleted or not found', async () => {
      productRepository.findCategoryById.mockResolvedValue(null);

      await expect(productService.create(validData)).rejects.toThrow('Category not found');
    });

    test('throws 400 if price is negative', async () => {
      productRepository.findCategoryById.mockResolvedValue({ id: 'cat-1' });

      await expect(productService.create({ ...validData, price: -5 }))
        .rejects.toThrow('Price must be a positive number');
    });

    test('throws 400 if price is zero', async () => {
      productRepository.findCategoryById.mockResolvedValue({ id: 'cat-1' });

      await expect(productService.create({ ...validData, price: 0 }))
        .rejects.toThrow('Price must be a positive number');
    });

    test('throws 400 if stock is a float', async () => {
      productRepository.findCategoryById.mockResolvedValue({ id: 'cat-1' });

      await expect(productService.create({ ...validData, stock: 1.5 }))
        .rejects.toThrow('Stock must be a non-negative whole number');
    });

    test('throws 400 if stock is negative', async () => {
      productRepository.findCategoryById.mockResolvedValue({ id: 'cat-1' });

      await expect(productService.create({ ...validData, stock: -1 }))
        .rejects.toThrow('Stock must be a non-negative whole number');
    });
  });

  // ── update ────────────────────────────────────────────────────────────────
  describe('update', () => {
    test('throws 404 if product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.update('missing', { name: 'X' }))
        .rejects.toThrow('Product not found');
    });

    test('regenerates slug when name changes', async () => {
      productRepository.findById.mockResolvedValue({ id: 'prod-1' });
      productRepository.update.mockResolvedValue({ id: 'prod-1' });

      await productService.update('prod-1', { name: 'New Name' });

      expect(productRepository.update).toHaveBeenCalledWith(
        'prod-1',
        expect.objectContaining({ name: 'New Name', slug: 'new-name' })
      );
    });

    test('validates new price on update', async () => {
      productRepository.findById.mockResolvedValue({ id: 'prod-1' });

      await expect(productService.update('prod-1', { price: -10 }))
        .rejects.toThrow('Price must be a positive number');
    });

    test('validates new stock on update', async () => {
      productRepository.findById.mockResolvedValue({ id: 'prod-1' });

      await expect(productService.update('prod-1', { stock: 1.5 }))
        .rejects.toThrow('Stock must be a non-negative whole number');
    });

    test('throws 400 if updated categoryId not found', async () => {
      productRepository.findById.mockResolvedValue({ id: 'prod-1' });
      productRepository.findCategoryById.mockResolvedValue(null);

      await expect(productService.update('prod-1', { categoryId: 'bad-cat' }))
        .rejects.toThrow('Category not found');
    });
  });

  // ── getById ───────────────────────────────────────────────────────────────
  describe('getById', () => {
    test('returns product when found', async () => {
      productRepository.findById.mockResolvedValue({ id: 'prod-1', name: 'Sneaker' });

      const result = await productService.getById('prod-1');

      expect(result).toEqual({ id: 'prod-1', name: 'Sneaker' });
    });

    test('throws 404 when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.getById('missing')).rejects.toThrow('Product not found');
    });
  });

  // ── getAll ────────────────────────────────────────────────────────────────
  test('getAll delegates to repository', async () => {
    productRepository.findAll.mockResolvedValue([{ id: 'prod-1' }]);

    const result = await productService.getAll();

    expect(productRepository.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'prod-1' }]);
  });

  // ── delete ────────────────────────────────────────────────────────────────
  describe('delete', () => {
    test('soft-deletes an existing product', async () => {
      productRepository.findById.mockResolvedValue({ id: 'prod-1' });
      productRepository.delete.mockResolvedValue({ id: 'prod-1' });

      await productService.delete('prod-1');

      expect(productRepository.delete).toHaveBeenCalledWith('prod-1');
    });

    test('throws 404 when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.delete('missing')).rejects.toThrow('Product not found');
    });
  });
});
