import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().trim().min(1, "Address ID is required"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});
