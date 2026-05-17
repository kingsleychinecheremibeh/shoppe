import { addressService } from "../services/addressService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user.id);
  res.json(addresses);
});

export const createAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, country } = req.body;
  const address = await addressService.createAddress(req.user.id, {
    fullName, phone, street, city, state, country,
  });
  res.status(201).json(address);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { fullName, phone, street, city, state, country } = req.body;
  const address = await addressService.updateAddress(req.params.id, req.user.id, {
    fullName, phone, street, city, state, country,
  });
  res.json(address);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.params.id, req.user.id);
  res.json({ message: "Address deleted successfully" });
});
