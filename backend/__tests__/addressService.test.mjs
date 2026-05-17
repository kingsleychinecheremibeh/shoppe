import { jest } from "@jest/globals";

const addressRepository = {
  findAllByUserId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

await jest.unstable_mockModule('../src/repositories/addressRepository.js', () => ({ addressRepository }));

const { addressService } = await import('../src/services/addressService.js');

describe('addressService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getAddresses delegates to repository with userId', async () => {
    addressRepository.findAllByUserId.mockResolvedValue([{ id: 'addr-1' }]);

    const result = await addressService.getAddresses('user-1');

    expect(addressRepository.findAllByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([{ id: 'addr-1' }]);
  });

  test('createAddress injects userId into data', async () => {
    const data = { fullName: 'Ada', phone: '1234567', street: '1 St', city: 'Lagos', state: 'Lagos', country: 'Nigeria' };
    addressRepository.create.mockResolvedValue({ id: 'addr-1', ...data, userId: 'user-1' });

    await addressService.createAddress('user-1', data);

    expect(addressRepository.create).toHaveBeenCalledWith({ ...data, userId: 'user-1' });
  });

  test('updateAddress succeeds when user owns the address', async () => {
    const data = { fullName: 'Ada B', phone: '7654321', street: '2 St', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' };
    addressRepository.findById.mockResolvedValue({ id: 'addr-1', userId: 'user-1' });
    addressRepository.update.mockResolvedValue({ id: 'addr-1', ...data });

    await addressService.updateAddress('addr-1', 'user-1', data);

    expect(addressRepository.update).toHaveBeenCalledWith('addr-1', data);
  });

  test('updateAddress throws 404 when address belongs to another user', async () => {
    addressRepository.findById.mockResolvedValue({ id: 'addr-1', userId: 'user-2' });

    await expect(addressService.updateAddress('addr-1', 'user-1', {}))
      .rejects.toThrow('Address not found');
  });

  test('updateAddress throws 404 when address does not exist', async () => {
    addressRepository.findById.mockResolvedValue(null);

    await expect(addressService.updateAddress('missing', 'user-1', {}))
      .rejects.toThrow('Address not found');
  });

  test('deleteAddress succeeds for an unused owned address', async () => {
    addressRepository.findById.mockResolvedValue({ id: 'addr-1', userId: 'user-1', orders: [] });
    addressRepository.delete.mockResolvedValue({ id: 'addr-1' });

    await addressService.deleteAddress('addr-1', 'user-1');

    expect(addressRepository.delete).toHaveBeenCalledWith('addr-1');
  });

  test('deleteAddress throws 404 when address belongs to another user', async () => {
    addressRepository.findById.mockResolvedValue({ id: 'addr-1', userId: 'user-2', orders: [] });

    await expect(addressService.deleteAddress('addr-1', 'user-1'))
      .rejects.toThrow('Address not found');
  });

  test('deleteAddress throws 400 when address is used by an order', async () => {
    addressRepository.findById.mockResolvedValue({ id: 'addr-1', userId: 'user-1', orders: [{ id: 'order-1' }] });

    await expect(addressService.deleteAddress('addr-1', 'user-1'))
      .rejects.toThrow('Cannot delete address used by an order');
  });
});
