import { z } from "zod";
import { sanitizedString } from "../utils/sanitize.js";

const nonEmptyUpdate = (data) => Object.keys(data).length > 0;

export const addressSchema = z.object({
  fullName: sanitizedString(z.string().trim().min(2).max(80)),
  phone: sanitizedString(z.string().trim().min(7).max(20)),
  street: sanitizedString(z.string().trim().min(3).max(150)),
  city: sanitizedString(z.string().trim().min(2).max(80)),
  state: sanitizedString(z.string().trim().min(2).max(80)),
  country: sanitizedString(z.string().trim().min(2).max(80)),
});

export const updateAddressSchema = addressSchema
  .partial()
  .refine(nonEmptyUpdate, "At least one field is required");
