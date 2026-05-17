import { jest } from "@jest/globals";

await jest.unstable_mockModule('../src/config/db.js', () => ({
  prisma: {
    address: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = await import('../src/config/db.js');
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} = await import('../src/controllers/addressController.js');

const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('addressController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('gets addresses for the current user', async () => {
    const req = { user: { id: 'user-1' } };
    const res = makeRes();
    prisma.address.findMany.mockResolvedValue([{ id: 'addr-1' }]);

    await getAddresses(req, res);

    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
    expect(res.json).toHaveBeenCalledWith([{ id: 'addr-1' }]);
  });

  test('creates an address for the current user', async () => {
    const body = {
      fullName: 'Ada Lovelace',
      phone: '1234567',
      street: '1 Byte Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
    };
    const req = { user: { id: 'user-1' }, body };
    const res = makeRes();
    prisma.address.create.mockResolvedValue({ id: 'addr-1', ...body });

    await createAddress(req, res);

    expect(prisma.address.create).toHaveBeenCalledWith({ data: { ...body, userId: 'user-1' } });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 'addr-1', ...body });
  });


  test('updates an owned address', async () => {
    const body = {
      fullName: 'Ada Byron',
      phone: '7654321',
      street: '2 Byte Street',
      city: 'Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
    };
    const req = { params: { id: 'addr-1' }, user: { id: 'user-1' }, body };
    const res = makeRes();
    prisma.address.findUnique.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    prisma.address.update.mockResolvedValue({ id: 'addr-1', ...body });

    await updateAddress(req, res);

    expect(prisma.address.update).toHaveBeenCalledWith({ where: { id: 'addr-1' }, data: body });
    expect(res.json).toHaveBeenCalledWith({ id: 'addr-1', ...body });
  });

  test('does not update another user address', async () => {
    const req = { params: { id: 'addr-1' }, user: { id: 'user-1' }, body: {} };
    const res = makeRes();
    const next = jest.fn();
    prisma.address.findUnique.mockResolvedValue({ id: 'addr-1', userId: 'user-2' });

    await updateAddress(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, message: 'Address not found' }));
    expect(res.status).not.toHaveBeenCalled();
  });

  test('deletes an unused owned address', async () => {
    const req = { params: { id: 'addr-1' }, user: { id: 'user-1' } };
    const res = makeRes();
    prisma.address.findUnique.mockResolvedValue({ id: 'addr-1', userId: 'user-1', orders: [] });
    prisma.address.delete.mockResolvedValue({ id: 'addr-1' });

    await deleteAddress(req, res);

    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: 'addr-1' } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Address deleted successfully' });
  });

  test('does not delete an address used by an order', async () => {
    const req = { params: { id: 'addr-1' }, user: { id: 'user-1' } };
    const res = makeRes();
    const next = jest.fn();
    prisma.address.findUnique.mockResolvedValue({ id: 'addr-1', userId: 'user-1', orders: [{ id: 'order-1' }] });

    await deleteAddress(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Cannot delete address used by an order' }));
    expect(res.status).not.toHaveBeenCalled();
  });
});
