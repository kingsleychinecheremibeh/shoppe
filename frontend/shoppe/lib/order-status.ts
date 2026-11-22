import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DeliveryTruck01Icon,
  Home01Icon,
} from "@hugeicons/core-free-icons";

export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

/**
 * One colour per order status, used everywhere an order appears:
 * Pending yellow · Paid green · Shipped blue · Delivered ink · Cancelled red.
 * `bg`/`fg` are the solid badge colours; `soft` tints a whole card or row.
 */
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; bg: string; fg: string; soft: string; icon: typeof Clock01Icon }
> = {
  PENDING: { label: "Pending", bg: "#FFC400", fg: "#141414", soft: "#FFF1C2", icon: Clock01Icon },
  PAID: { label: "Paid", bg: "#1FAF6E", fg: "#141414", soft: "#D6F3E5", icon: CheckmarkCircle02Icon },
  SHIPPED: { label: "Shipped", bg: "#2F5BFF", fg: "#FFFFFF", soft: "#E3E9FF", icon: DeliveryTruck01Icon },
  DELIVERED: { label: "Delivered", bg: "#141414", fg: "#FAF7F0", soft: "#F3EEE3", icon: Home01Icon },
  CANCELLED: { label: "Cancelled", bg: "#D93636", fg: "#FFFFFF", soft: "#FDE8E8", icon: Cancel01Icon },
};

export const getOrderStatus = (status?: string | null) =>
  ORDER_STATUS[(status?.toUpperCase() as OrderStatus) || "PENDING"] || ORDER_STATUS.PENDING;

/** Short, human-friendly order number: the first 8 characters of the id. */
export const shortOrderId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

/** The happy-path steps an order moves through, for timelines. */
export const ORDER_STEPS: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED"];
