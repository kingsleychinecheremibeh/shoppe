import express from "express";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { addressSchema, updateAddressSchema } from "../validators/addressValidators.js";

const router = express.Router();

router.get("/", protect, getAddresses);
router.post("/", protect, validate(addressSchema), createAddress);
router.put("/:id", protect, validate(updateAddressSchema), updateAddress);
router.delete("/:id", protect, deleteAddress);

export default router;
