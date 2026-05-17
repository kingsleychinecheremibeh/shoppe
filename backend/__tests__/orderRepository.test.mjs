import { jest } from "@jest/globals";

// tx no longer fetches address inside the transaction — it's passed in from the service
const tx = {
  order: { create: jest.fn(), delete: jest.fn() },
  orderItem: { deleteMany: jest.fn() },
  product: { updateMany: jest.fn() },
  cartItem: { deleteMany: jest.fn() },
};

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    address: { findUnique: jest.fn() },
    cart: { findUnique: jest.fn() },
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(tx)),
  },
}));

const { prisma } = await import('../src/config/db.js');
const { orderRepository } = await import('../src/repositories/orderRepository.js');

describe('orderRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('finds address by id', async () => {
    await orderRepository.findAddressById('addr-1');

    expect(prisma.address.findUnique).toHaveBeenCalledWith({ where: { id: 'addr-1' } });
  });

  test('finds cart by user id with products', async () => {
    await orderRepository.findCartByUserId('user-1');

    expect(prisma.cart.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { items: { include: { product: true } } },
    });
  });

  test('creates order transaction, decrements stock, and clears cart', async () => {
    const address = {
      id: 'addr-1',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      phone: '1234567',
      street: '1 Byte Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    };
    const cart = {
      id: 'cart-1',
      items: [{ productId: 'prod-1', quantity: 2, product: { name: 'Sneaker', price: 50 } }],
    };
    tx.order.create.mockResolvedValue({ id: 'order-1' });
    tx.product.updateMany.mockResolvedValue({ count: 1 });

    const result = await orderRepository.createOrderTransaction({
      userId: 'user-1',
      addressId: 'addr-1',
      address,
      cart,
      total: 100,
    });

    expect(tx.order.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        addressId: 'addr-1',
        total: 100,
        shippingName: 'Ada Lovelace',
        shippingPhone: '1234567',
        shippingStreet: '1 Byte Street',
        shippingCity: 'Lagos',
        shippingState: 'Lagos',
        shippingCountry: 'Nigeria',
        orderItems: { create: [{ productId: 'prod-1', quantity: 2, price: 50 }] },
      },
      include: { orderItems: { include: { product: true } }, address: true },
    });
    expect(tx.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'prod-1', stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
    expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-1' } });
    expect(result).toEqual({ id: 'order-1' });
  });

  test('transaction rejects when stock update cannot reserve item', async () => {
    const address = {
      id: 'addr-1',
      userId: 'user-1',
      fullName: 'Ada Lovelace',
      phone: '1234567',
      street: '1 Byte Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    };
    tx.order.create.mockResolvedValue({ id: 'order-1' });
    tx.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(orderRepository.createOrderTransaction({
      userId: 'user-1',
      addressId: 'addr-1',
      address,
      cart: { id: 'cart-1', items: [{ productId: 'prod-1', quantity: 5, product: { name: 'Sneaker', price: 50 } }] },
      total: 250,
    })).rejects.toThrow('Sneaker does not have enough stock');
  });

  test('finds orders by user id', async () => {
    await orderRepository.findOrdersByUserId('user-1');

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: { orderItems: { include: { product: true } }, address: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  test('finds order by id with user details', async () => {
    await orderRepository.findOrderById('order-1');

    expect(prisma.order.findUnique).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  });

  test('finds all orders for admin', async () => {
    await orderRepository.findAllOrders();

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      include: {
        orderItems: { include: { product: true } },
        address: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  test('updates order status', async () => {
    await orderRepository.updateOrderStatus('order-1', 'PAID');

    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'PAID' },
      include: { orderItems: { include: { product: true } }, address: true },
    });
  });

  test('deletes order by id', async () => {
    await orderRepository.deleteOrder('order-1');

    expect(tx.orderItem.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'order-1' } });
    expect(tx.order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
  });
});
