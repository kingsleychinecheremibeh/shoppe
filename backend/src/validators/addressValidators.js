import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20),
  street: z.string().trim().min(3).max(150),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
});

export const updateAddressSchema = addressSchema.partial();
