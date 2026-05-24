import { shippingService } from "../services/shippingServices.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getActiveShippingMethods = asyncHandler(async (req, res) => {
  const methods = await shippingService.getActiveMethods();
  res.json(methods);
});

export const getAllShippingMethods = asyncHandler(async (req, res) => {
  const methods = await shippingService.getAllMethods();
  res.json(methods);
});

export const createShippingMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.createMethod(req.body);
  res.status(201).json(method);
});

export const updateShippingMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.updateMethod(req.params.id, req.body);
  res.json(method);
});

export const deleteShippingMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.deleteMethod(req.params.id);
  res.json(method);
});