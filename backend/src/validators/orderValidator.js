import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().trim().uuid("Address ID must be a valid UUID"),
  paymentGateway: z.string().trim().optional(),
  paymentReference: z.string().trim().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});
