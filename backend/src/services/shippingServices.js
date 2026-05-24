import { shippingRepository } from "../repositories/shippingRepository.js";
import { AppError } from "../utils/AppError.js";

export const shippingService = {
  getActiveMethods() {
    return shippingRepository.findActive();
  },

  getAllMethods() {
    return shippingRepository.findAll();
  },

  createMethod(data) {
    return shippingRepository.create({
      name: data.name,
      description: data.description,
      price: data.price,
      estimatedDays: data.estimatedDays,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    });
  },

  async updateMethod(id, data) {
    const method = await shippingRepository.findById(id);
    if (!method) throw new AppError("Shipping method not found", 404);

    return shippingRepository.update(id, data);
  },

  async deleteMethod(id) {
    const method = await shippingRepository.findById(id);
    if (!method) throw new AppError("Shipping method not found", 404);

    return shippingRepository.deactivate(id);
  },

  async getActiveMethodById(id) {
    const method = await shippingRepository.findById(id);

    if (!method || !method.isActive) {
      throw new AppError("Shipping method not found", 404);
    }

    return method;
  },
};