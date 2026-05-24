import { jest } from "@jest/globals";
import express from 'express';
import request from 'supertest';

const protect = (req, res, next) => {
  req.user = { id: 'user-1', role: req.headers['x-role'] || 'USER' };
  next();
};
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'ADMIN') return next();
  return res.status(403).json({ message: 'Access denied. Admin only.' });
};

const addressHandlers = {
  getAddresses: jest.fn((req, res) => res.json({ handler: 'getAddresses' })),
  createAddress: jest.fn((req, res) => res.status(201).json({ handler: 'createAddress' })),
  updateAddress: jest.fn((req, res) => res.json({ handler: 'updateAddress' })),
  deleteAddress: jest.fn((req, res) => res.json({ handler: 'deleteAddress' })),
};
const authHandlers = {
  registerUser: jest.fn((req, res) => res.status(201).json({ handler: 'registerUser' })),
  loginUser: jest.fn((req, res) => res.json({ handler: 'loginUser' })),
  refreshAccessToken: jest.fn((req, res) => res.json({ handler: 'refreshAccessToken' })),
  getCurrentUser: jest.fn((req, res) => res.json({ handler: 'getCurrentUser' })),
  logoutUser: jest.fn((req, res) => res.json({ handler: 'logoutUser' })),
};
const cartHandlers = {
  getCart: jest.fn((req, res) => res.json({ handler: 'getCart' })),
  addItemToCart: jest.fn((req, res) => res.status(201).json({ handler: 'addItemToCart' })),
  updateCartItem: jest.fn((req, res) => res.json({ handler: 'updateCartItem' })),
  removeCartItem: jest.fn((req, res) => res.json({ handler: 'removeCartItem' })),
  clearCart: jest.fn((req, res) => res.json({ handler: 'clearCart' })),
};
const categoryHandlers = {
  getCategories: jest.fn((req, res) => res.json({ handler: 'getCategories' })),
  createCategory: jest.fn((req, res) => res.status(201).json({ handler: 'createCategory' })),
  updateCategory: jest.fn((req, res) => res.json({ handler: 'updateCategory' })),
  deleteCategory: jest.fn((req, res) => res.json({ handler: 'deleteCategory' })),
};
const orderHandlers = {
  createOrder: jest.fn((req, res) => res.status(201).json({ handler: 'createOrder' })),
  getMyOrders: jest.fn((req, res) => res.json({ handler: 'getMyOrders' })),
  getOrderById: jest.fn((req, res) => res.json({ handler: 'getOrderById' })),
  getAllOrders: jest.fn((req, res) => res.json({ handler: 'getAllOrders' })),
  updateOrderStatus: jest.fn((req, res) => res.json({ handler: 'updateOrderStatus' })),
  deleteOrder: jest.fn((req, res) => res.json({ handler: 'deleteOrder' })),
};

await jest.unstable_mockModule('../src/middleware/authMiddleware.js', () => ({ protect, adminOnly }));
await jest.unstable_mockModule('../src/controllers/addressController.js', () => addressHandlers);
await jest.unstable_mockModule('../src/controllers/authController.js', () => authHandlers);
await jest.unstable_mockModule('../src/controllers/cartController.js', () => cartHandlers);
await jest.unstable_mockModule('../src/controllers/categoryController.js', () => categoryHandlers);
await jest.unstable_mockModule('../src/controllers/orderController.js', () => orderHandlers);

const { default: addressRoutes } = await import('../src/routes/addressRoutes.js');
const { default: authRoutes } = await import('../src/routes/authRoutes.js');
const { default: cartRoutes } = await import('../src/routes/cartRoutes.js');
const { default: categoryRoute } = await import('../src/routes/categoryRoute.js');
const { default: orderRoutes } = await import('../src/routes/orderRoutes.js');

const app = express();
app.use(express.json());
app.use('/addresses', addressRoutes);
app.use('/auth', authRoutes);
app.use('/cart', cartRoutes);
app.use('/categories', categoryRoute);
app.use('/orders', orderRoutes);

describe('remaining routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('address routes call their handlers with validation', async () => {
    const address = {
      fullName: 'Ada Lovelace',
      phone: '1234567',
      street: '1 Byte Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    };

    expect((await request(app).get('/addresses').send(address)).body).toEqual({ handler: 'getAddresses' });
    expect((await request(app).post('/addresses').send(address)).status).toBe(201);
    expect((await request(app).put('/addresses/addr-1').send(address)).body).toEqual({ handler: 'updateAddress' });
    expect((await request(app).delete('/addresses/addr-1')).body).toEqual({ handler: 'deleteAddress' });
  });

  test('address route validation rejects invalid bodies', async () => {
    const response = await request(app).post('/addresses').send({ fullName: 'A' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  test('auth routes call their handlers', async () => {
    expect((await request(app).post('/auth/register').send({ name: 'Ada', email: 'ada@example.com', password: 'secret1' })).status).toBe(201);
    expect((await request(app).post('/auth/login').send({ email: 'ada@example.com', password: 'secret1' })).body).toEqual({ handler: 'loginUser' });
    expect((await request(app).post('/auth/refresh-token')).body).toEqual({ handler: 'refreshAccessToken' });
    expect((await request(app).post('/auth/logout')).body).toEqual({ handler: 'logoutUser' });
    expect((await request(app).get('/auth/me')).body).toEqual({ handler: 'getCurrentUser' });
  });

  test('cart routes call their handlers', async () => {
    expect((await request(app).get('/cart')).body).toEqual({ handler: 'getCart' });
    expect((await request(app).post('/cart/items').send({ productId: '11111111-1111-4111-8111-111111111111', quantity: 1 })).status).toBe(201);
    expect((await request(app).put('/cart/items/item-1').send({ quantity: 2 })).body).toEqual({ handler: 'updateCartItem' });
    expect((await request(app).delete('/cart/items/item-1')).body).toEqual({ handler: 'removeCartItem' });
    expect((await request(app).delete('/cart')).body).toEqual({ handler: 'clearCart' });
  });

  test('category routes call public and admin handlers', async () => {
    expect((await request(app).get('/categories')).body).toEqual({ handler: 'getCategories' });
    expect((await request(app).post('/categories').set('x-role', 'ADMIN').send({ name: 'Shoes' })).status).toBe(201);
    expect((await request(app).put('/categories/cat-1').set('x-role', 'ADMIN').send({ name: 'Bags' })).body).toEqual({ handler: 'updateCategory' });
    expect((await request(app).delete('/categories/cat-1').set('x-role', 'ADMIN')).body).toEqual({ handler: 'deleteCategory' });
  });

  test('order routes call protected and admin handlers', async () => {
    expect((await request(app).post('/orders').send({ addressId: '22222222-2222-4222-8222-222222222222', shippingMethodId: '11111111-1111-4111-8111-111111111111' })).status).toBe(201);
    expect((await request(app).get('/orders/my-orders')).body).toEqual({ handler: 'getMyOrders' });
    expect((await request(app).get('/orders').set('x-role', 'ADMIN')).body).toEqual({ handler: 'getAllOrders' });
    expect((await request(app).put('/orders/order-1/status').set('x-role', 'ADMIN').send({ status: 'PAID' })).body).toEqual({ handler: 'updateOrderStatus' });
    expect((await request(app).get('/orders/order-1')).body).toEqual({ handler: 'getOrderById' });
    expect((await request(app).delete('/orders/order-1').set('x-role', 'ADMIN')).body).toEqual({ handler: 'deleteOrder' });
  });
});
