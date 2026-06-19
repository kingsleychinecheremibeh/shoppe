import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "MANAGER", "ADMIN"]),
  managerPermissions: z
    .array(
      z.enum([
        "ORDER_MANAGEMENT",
        "PRODUCT_MANAGEMENT",
        "SHIPPING_MANAGEMENT",
        "ANALYTICS",
      ])
    )
    .optional(),
});
