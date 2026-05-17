import { addressRepository } from "../repositories/addressRepository.js";
import { AppError } from "../utils/AppError.js";

export const addressService = {
    async getAddresses(userId) {
        return addressRepository.findAllByUserId(userId);
    },

    async createAddress(userId, data) {
        return addressRepository.create({ ...data, userId });
    },

    async updateAddress(id, userId, data) {
        const existing = await addressRepository.findById(id);
        if (!existing || existing.userId !== userId) {
            throw new AppError("Address not found", 404);
        }
        return addressRepository.update(id, data);
    },

    async deleteAddress(id, userId) {
        const existing = await addressRepository.findById(id);
        if (!existing || existing.userId !== userId) {
            throw new AppError("Address not found", 404);
        }
        if (existing.orders.length > 0) {
            throw new AppError("Cannot delete address used by an order", 400);
        }
        return addressRepository.delete(id);
    },
};
