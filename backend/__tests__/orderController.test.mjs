import { jest } from "@jest/globals";

const orderService = {
  createOrder: jest.fn(),
  getMyOrders: jest.fn(),
  getOrderById: jest.fn(),
  getAllOrders: jest.fn(),
  updateOrderStatus: jest.fn(),
  deleteOrder: jest.fn(),
};

await jest.unstable_mockModule('../src/services/orderService.js', () => ({ orderService }));

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} = await import('../src/controllers/orderController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('orderController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates an order', async () => {
    const req = { user: { id: 'user-1' }, body: { addressId: 'addr-1' } };
    const res = makeRes();
    orderService.createOrder.mockResolvedValue({ id: 'order-1' });

    await createOrder(req, res);

    expect(orderService.createOrder).toHaveBeenCalledWith('user-1', 'addr-1', undefined, undefined, undefined);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'order-1' });
  });

  test('forwards errors to next when order creation fails', async () => {
    const req = { user: { id: 'user-1' }, body: {} };
    const res = makeRes();
    const next = jest.fn();
    const error = new Error('Address ID is required');
    orderService.createOrder.mockRejectedValue(error);

    await createOrder(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('gets current user orders', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    orderService.getMyOrders.mockResolvedValue([{ id: 'order-1' }]);

    await getMyOrders(req, res);

    expect(orderService.getMyOrders).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith([{ id: 'order-1' }]);
  });

  test('gets order by id for current user', async () => {
    const req = { params: { id: 'order-1' }, user: { id: 'user-1', role: 'USER' } };
    const res = makeRes();
    orderService.getOrderById.mockResolvedValue({ id: 'order-1' });

    await getOrderById(req, res);

    expect(orderService.getOrderById).toHaveBeenCalledWith('order-1', req.user);
    expect(res.json).toHaveBeenCalledWith({ id: 'order-1' });
  });

  test('gets all orders', async () => {
    const res = makeRes();
    orderService.getAllOrders.mockResolvedValue([{ id: 'order-1' }]);

    await getAllOrders({}, res);

    expect(res.json).toHaveBeenCalledWith([{ id: 'order-1' }]);
  });

  test('updates order status', async () => {
    const req = { params: { id: 'order-1' }, body: { status: 'PAID' } };
    const res = makeRes();
    orderService.updateOrderStatus.mockResolvedValue({ id: 'order-1', status: 'PAID' });

    await updateOrderStatus(req, res);

    expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'PAID');
    expect(res.json).toHaveBeenCalledWith({ id: 'order-1', status: 'PAID' });
  });

  test('deletes an order', async () => {
    const req = { params: { id: 'order-1' } };
    const res = makeRes();
    orderService.deleteOrder.mockResolvedValue({ id: 'order-1' });

    await deleteOrder(req, res);

    expect(orderService.deleteOrder).toHaveBeenCalledWith('order-1');
    expect(res.json).toHaveBeenCalledWith({ message: 'Order deleted successfully' });
  });
});
