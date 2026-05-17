import { jest } from "@jest/globals";
import request from 'supertest';
import express from 'express';

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = await import('../src/config/db.js');
const { default: productRoute } = await import('../src/routes/productRoute.js');
const { errorHandler } = await import('../src/middleware/errorMiddleware.js');

const app = express();
app.use(express.json());
app.use('/api/products', productRoute);
app.use(errorHandler);

describe('Product Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    test('should return products', async () => {
      const mockProducts = [{ id: '1', name: 'Test Product' }];
      prisma.product.findMany.mockResolvedValue(mockProducts);

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProducts);
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return product by id', async () => {
      const mockProduct = { id: '1', name: 'Test Product' };
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProduct);
    });

    test('should return 404 if product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      const response = await request(app).get('/api/products/1');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'fail',
        message: 'Product not found',
      });
    });
  });

  // Note: POST, PUT, DELETE require auth middleware, which would need mocking or a test setup with auth
  // For simplicity, skipping those here, but you can add them with proper auth mocking
});
