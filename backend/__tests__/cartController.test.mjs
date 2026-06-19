import { jest } from "@jest/globals";

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    cart: { findUnique: jest.fn(), create: jest.fn() },
    cartItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: { findFirst: jest.fn() },
  },
}));

const { prisma } = await import('../src/config/db.js');
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = await import('../src/controllers/cartController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('cartController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('gets an existing cart with items', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    prisma.cart.findUnique
      .mockResolvedValueOnce({ id: 'cart-1', userId: 'user-1' })
      .mockResolvedValueOnce({ id: 'cart-1', items: [] });

    await getCart(req, res);

    expect(prisma.cart.findUnique).toHaveBeenLastCalledWith({
      where: { id: 'cart-1' },
      include: { items: { include: { product: true }, orderBy: { createdAt: 'desc' } } },
    });
    expect(res.json).toHaveBeenCalledWith({ id: 'cart-1', items: [] });
  });

  test('creates a cart when the user has none', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    prisma.cart.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'cart-1', items: [] });
    prisma.cart.create.mockResolvedValue({ id: 'cart-1', userId: 'user-1' });

    await getCart(req, res);

    expect(prisma.cart.create).toHaveBeenCalledWith({ data: { userId: 'user-1' } });
    expect(res.json).toHaveBeenCalledWith({ id: 'cart-1', items: [] });
  });

  test('adds a new item to the cart', async () => {
    const req = { user: { id: 'user-1' }, body: { productId: 'prod-1', quantity: 2 } };
    const res = makeRes();
    prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', stock: 5 });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findFirst.mockResolvedValue(null);
    prisma.cartItem.create.mockResolvedValue({ id: 'item-1', quantity: 2 });

    await addItemToCart(req, res);

    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: { cartId: 'cart-1', productId: 'prod-1', quantity: 2, selectedColor: null, productImageId: null },
      include: { product: true },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updates an existing cart item when adding the same product', async () => {
    const req = { user: { id: 'user-1' }, body: { productId: 'prod-1', quantity: 2 } };
    const res = makeRes();
    prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', stock: 5 });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findFirst.mockResolvedValue({ id: 'item-1', quantity: 1 });
    prisma.cartItem.update.mockResolvedValue({ id: 'item-1', quantity: 3 });

    await addItemToCart(req, res);

    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 3 },
      include: { product: true },
    });
  });

  test('forwards 400 AppError to next for invalid quantity', async () => {
    const req = { user: { id: 'user-1' }, body: { productId: 'prod-1', quantity: 1.5 } };
    const res = makeRes();
    const next = jest.fn();

    await addItemToCart(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Quantity must be a positive whole number' }));
    expect(res.status).not.toHaveBeenCalled();
  });

  test('forwards 404 AppError to next when product not found', async () => {
    const req = { user: { id: 'user-1' }, body: { productId: 'prod-1', quantity: 2 } };
    const res = makeRes();
    const next = jest.fn();
    prisma.product.findFirst.mockResolvedValue(null);
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });

    await addItemToCart(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Product not found' }));
  });

  test('forwards 400 AppError to next when quantity exceeds stock', async () => {
    const req = { user: { id: 'user-1' }, body: { productId: 'prod-1', quantity: 10 } };
    const res = makeRes();
    const next = jest.fn();
    prisma.product.findFirst.mockResolvedValue({ id: 'prod-1', stock: 3 });
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findFirst.mockResolvedValue(null);

    await addItemToCart(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Not enough stock available' }));
  });

  test('updates a cart item quantity', async () => {
    const req = { params: { id: 'item-1' }, user: { id: 'user-1' }, body: { quantity: 4 } };
    const res = makeRes();
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue({ id: 'item-1', cartId: 'cart-1', product: { stock: 10 } });
    prisma.cartItem.update.mockResolvedValue({ id: 'item-1', quantity: 4 });

    await updateCartItem(req, res);

    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 4 },
      include: { product: true },
    });
    expect(res.json).toHaveBeenCalledWith({ id: 'item-1', quantity: 4 });
  });

  test('forwards 404 AppError to next when updating item not in user cart', async () => {
    const req = { params: { id: 'item-99' }, user: { id: 'user-1' }, body: { quantity: 2 } };
    const res = makeRes();
    const next = jest.fn();
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue(null);

    await updateCartItem(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Cart item not found' }));
  });

  test('removes a cart item owned by the user cart', async () => {
    const req = { params: { id: 'item-1' }, user: { id: 'user-1' } };
    const res = makeRes();
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue({ id: 'item-1', cartId: 'cart-1' });

    await removeCartItem(req, res);

    expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-1' } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Cart item removed successfully' });
  });

  test('forwards 404 AppError to next when removing item not in user cart', async () => {
    const req = { params: { id: 'item-99' }, user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });
    prisma.cartItem.findUnique.mockResolvedValue(null);

    await removeCartItem(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Cart item not found' }));
  });

  test('clears the cart', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1' });

    await clearCart(req, res);

    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Cart cleared successfully' });
  });
});
