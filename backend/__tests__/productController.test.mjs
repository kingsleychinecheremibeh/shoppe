import { jest } from "@jest/globals";

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findFirst: jest.fn(),
    },
  },
}));

const auditRepository = {
  log: jest.fn(),
};

await jest.unstable_mockModule('../src/repositories/auditRepository.js', () => ({ auditRepository }));

const notificationService = {
  notifyNewProduct: jest.fn(),
};

await jest.unstable_mockModule('../src/services/notificationService.js', () => ({ notificationService }));

const { prisma } = await import('../src/config/db.js');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = await import('../src/controllers/productController.js');

const makeRes = () => ({
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
});

const productInclude = {
  category: true,
  images: {
    orderBy: { sortOrder: 'asc' },
  },
};

describe('productController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = makeRes();
    next = jest.fn();
  });

  describe('getProducts', () => {
    test('should return products', async () => {
      const mockProducts = [{ id: '1', name: 'Test Product' }];
      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(1);

      await getProducts(req, res, next);

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 12,
      });
      expect(res.json).toHaveBeenCalledWith({
        data: mockProducts,
        meta: {
          currentPage: 1,
          limit: 12,
          totalItems: 1,
          totalPages: 1,
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should pass errors to next', async () => {
      const error = new Error('DB error');
      prisma.product.findMany.mockRejectedValue(error);

      await getProducts(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getProductById', () => {
    beforeEach(() => {
      req = { params: { id: '1' } };
    });

    test('should return product if found', async () => {
      const mockProduct = { id: '1', name: 'Test Product' };
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      await getProductById(req, res, next);

      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: null },
        include: productInclude,
      });
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    test('should pass 404 error if not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await getProductById(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Product not found',
        statusCode: 404,
      }));
    });
  });

  describe('createProduct', () => {
    beforeEach(() => {
      req = {
        body: {
          name: 'New Product',
          description: 'Description',
          price: '1099',
          stock: '5',
          categoryId: 'cat1',
          image: 'http://s3/image.jpg',
        },
      };
    });

    test('should create product successfully', async () => {
      const mockCategory = { id: 'cat1' };
      const mockProduct = { id: '1', name: 'New Product' };
      prisma.category.findFirst.mockResolvedValue(mockCategory);
      prisma.product.create.mockResolvedValue(mockProduct);
      notificationService.notifyNewProduct.mockResolvedValue(undefined);

      await createProduct(req, res, next);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'New Product',
          slug: expect.any(String),
          description: 'Description',
          price: 1099,
          image: 'http://s3/image.jpg',
          stock: 5,
          categoryId: 'cat1',
        },
        include: productInclude,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
      expect(notificationService.notifyNewProduct).toHaveBeenCalledWith(mockProduct);
    });

    test('should pass 400 error if missing fields', async () => {
      req.body.name = '';

      await createProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Name, description, and category are required',
        statusCode: 400,
      }));
    });

    test('should pass 400 error if invalid price', async () => {
      req.body.price = '-10';
      prisma.category.findFirst.mockResolvedValue({ id: 'cat1' });

      await createProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Price must be a positive number',
        statusCode: 400,
      }));
    });

    test('should pass 400 error if category not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await createProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Category not found',
        statusCode: 400,
      }));
    });
  });

  describe('updateProduct', () => {
    beforeEach(() => {
      req = {
        params: { id: '1' },
        body: { name: 'Updated Product', price: '20.00' },
      };
    });

    test('should update product successfully', async () => {
      const mockProduct = { id: '1', name: 'Old Product' };
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated Product' });

      await updateProduct(req, res, next);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated Product', slug: expect.any(String), price: 20 },
        include: productInclude,
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Product' }));
    });

    test('should pass 404 error if product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await updateProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Product not found',
        statusCode: 404,
      }));
    });
  });

  describe('deleteProduct', () => {
    beforeEach(() => {
      req = { params: { id: '1' } };
    });

    test('should delete product successfully', async () => {
      const mockProduct = { id: '1' };
      prisma.product.findFirst.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue(mockProduct);

      await deleteProduct(req, res, next);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(res.json).toHaveBeenCalledWith({ message: 'Product deleted successfully' });
    });

    test('should pass 404 error if product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await deleteProduct(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Product not found',
        statusCode: 404,
      }));
    });
  });
});
