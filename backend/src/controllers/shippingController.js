import { shippingService } from "../services/shippingServices.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { auditRepository } from "../repositories/auditRepository.js";

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
  await auditRepository.log({
    req,
    action: "SHIPPING_METHOD_CREATED",
    entity: "ORDER",
    entityId: method.id,
    metadata: { name: method.name },
  });
  res.status(201).json(method);
});

export const updateShippingMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.updateMethod(req.params.id, req.body);
  await auditRepository.log({
    req,
    action: "SHIPPING_METHOD_UPDATED",
    entity: "ORDER",
    entityId: method.id,
    metadata: { fields: Object.keys(req.body) },
  });
  res.json(method);
});

export const deleteShippingMethod = asyncHandler(async (req, res) => {
  const method = await shippingService.deleteMethod(req.params.id);
  await auditRepository.log({
    req,
    action: "SHIPPING_METHOD_DELETED",
    entity: "ORDER",
    entityId: method.id,
  });
  res.json(method);
});
