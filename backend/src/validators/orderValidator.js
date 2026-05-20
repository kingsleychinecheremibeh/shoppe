import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().trim().uuid("Address ID must be a valid UUID"),
  paymentGateway: z.enum(["STRIPE", "PAYSTACK"]).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});
