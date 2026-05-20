import { jest } from "@jest/globals";

const orderRepository = {
  findAddressById: jest.fn(),
  findCartByUserId: jest.fn(),
  createOrderTransaction: jest.fn(),
  findOrdersByUserId: jest.fn(),
  findOrderById: jest.fn(),
  findAllOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
  deleteOrder: jest.fn(),
};

await jest.unstable_mockModule('../src/repositories/orderRepository.js', () => ({ orderRepository }));

const { orderService } = await import('../src/services/orderService.js');

describe('orderService', () => {
  beforeEach(() => jest.clearAllMocks());

  const cart = {
    id: 'cart-1',
    items: [
      { productId: 'prod-1', quantity: 2, product: { name: 'Sneaker', price: 50, stock: 3 } },
      { productId: 'prod-2', quantity: 1, product: { name: 'Bag', price: 25, stock: 2 } },
    ],
  };

  test('creates an order from a valid cart and address', async () => {
    orderRepository.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    orderRepository.findCartByUserId.mockResolvedValue(cart);
    orderRepository.createOrderTransaction.mockResolvedValue({ id: 'order-1' });

    const result = await orderService.createOrder('user-1', 'addr-1');

    expect(orderRepository.createOrderTransaction).toHaveBeenCalledWith({
      userId: 'user-1',
      addressId: 'addr-1',
      address: { id: 'addr-1', userId: 'user-1' },
      cart,
      total: 125,
      idempotencyKey: undefined,
      paymentGateway: undefined,
    });
    expect(result).toEqual({ id: 'order-1' });
  });

  test('requires address id', async () => {
    await expect(orderService.createOrder('user-1')).rejects.toThrow('Address ID is required');
  });

  test('rejects an address owned by another user', async () => {
    orderRepository.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'user-2' });

    await expect(orderService.createOrder('user-1', 'addr-1')).rejects.toThrow('Address not found');
  });

  test('rejects an empty cart', async () => {
    orderRepository.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    orderRepository.findCartByUserId.mockResolvedValue({ id: 'cart-1', items: [] });

    await expect(orderService.createOrder('user-1', 'addr-1')).rejects.toThrow('Cart is empty');
  });

  test('rejects cart items above stock', async () => {
    orderRepository.findAddressById.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    orderRepository.findCartByUserId.mockResolvedValue({
      id: 'cart-1',
      items: [{ quantity: 5, product: { name: 'Sneaker', stock: 1 } }],
    });

    await expect(orderService.createOrder('user-1', 'addr-1')).rejects.toThrow('Sneaker does not have enough stock');
  });

  test('gets my orders', async () => {
    orderRepository.findOrdersByUserId.mockResolvedValue([{ id: 'order-1' }]);

    await expect(orderService.getMyOrders('user-1')).resolves.toEqual([{ id: 'order-1' }]);
  });

  test('allows owner to get order by id', async () => {
    orderRepository.findOrderById.mockResolvedValue({ id: 'order-1', userId: 'user-1' });

    await expect(orderService.getOrderById('order-1', { id: 'user-1', role: 'USER' })).resolves.toEqual({ id: 'order-1', userId: 'user-1' });
  });

  test('allows admin to get any order by id', async () => {
    orderRepository.findOrderById.mockResolvedValue({ id: 'order-1', userId: 'user-2' });

    await expect(orderService.getOrderById('order-1', { id: 'admin-1', role: 'ADMIN' })).resolves.toEqual({ id: 'order-1', userId: 'user-2' });
  });

  test('denies non-owner non-admin order access', async () => {
    orderRepository.findOrderById.mockResolvedValue({ id: 'order-1', userId: 'user-2' });

    await expect(orderService.getOrderById('order-1', { id: 'user-1', role: 'USER' })).rejects.toThrow('Access denied');
  });

  test('gets all orders', async () => {
    orderRepository.findAllOrders.mockResolvedValue([{ id: 'order-1' }]);

    await expect(orderService.getAllOrders()).resolves.toEqual([{ id: 'order-1' }]);
  });

  test('updates order status using allowed transition', async () => {
    orderRepository.findOrderById.mockResolvedValue({ id: 'order-1', status: 'PENDING' });
    orderRepository.updateOrderStatus.mockResolvedValue({ id: 'order-1', status: 'PAID' });

    await orderService.updateOrderStatus('order-1', 'PAID');

    expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith('order-1', 'PAID');
  });

  test('rejects invalid order status transition', async () => {
    orderRepository.findOrderById.mockResolvedValue({ id: 'order-1', status: 'DELIVERED' });

    await expect(orderService.updateOrderStatus('order-1', 'PAID')).rejects.toThrow('Cannot change status from DELIVERED to PAID');
  });

  test('deletes an existing order', async () => {
    orderRepository.findOrderById.mockResolvedValue({ id: 'order-1' });
    orderRepository.deleteOrder.mockResolvedValue({ id: 'order-1' });

    await orderService.deleteOrder('order-1');

    expect(orderRepository.deleteOrder).toHaveBeenCalledWith('order-1');
  });

  test('throws 404 when deleting a non-existent order', async () => {
    orderRepository.findOrderById.mockResolvedValue(null);

    await expect(orderService.deleteOrder('missing')).rejects.toThrow('Order not found');
  });
});
