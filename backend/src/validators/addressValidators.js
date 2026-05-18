import { z } from "zod";

const nonEmptyUpdate = (data) => Object.keys(data).length > 0;

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  street: z.string().trim().min(3).max(150),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
});

export const updateAddressSchema = addressSchema
  .partial()
  .refine(nonEmptyUpdate, "At least one field is required");
