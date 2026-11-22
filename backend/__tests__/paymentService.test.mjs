import { jest } from "@jest/globals";
import crypto from "crypto";

const orderRepository = {
  findOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  markPaidIfPending: jest.fn(),
};

const axios = {
  post: jest.fn(),
  get: jest.fn(),
};

const paymentIntentsCreate = jest.fn();
const constructEvent = jest.fn();

await jest.unstable_mockModule("../src/repositories/orderRepository.js", () => ({
  orderRepository,
}));

const notificationService = {
  notifyPaymentReceived: jest.fn(),
  notifyRefundRequired: jest.fn(),
};

await jest.unstable_mockModule("../src/services/notificationService.js", () => ({
  notificationService,
}));

await jest.unstable_mockModule("axios", () => ({
  default: axios,
}));

await jest.unstable_mockModule("stripe", () => ({
  default: jest.fn(() => ({
    paymentIntents: {
      create: paymentIntentsCreate,
    },
    webhooks: {
      constructEvent,
    },
  })),
}));

process.env.PAYSTACK_SECRET_KEY = "paystack-secret";
process.env.STRIPE_SECRET_KEY = "stripe-secret";
process.env.STRIPE_WEBHOOK_SECRET = "stripe-webhook-secret";
process.env.FRONTEND_URL = "http://localhost:3000";

const { paymentService } = await import("../src/services/paymentService.js");

const signPaystackBody = (body) => {
  return crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(body))
    .digest("hex");
};

describe("paymentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_ENABLED = "false";
  });

  test("initializes Paystack only for the order owner and expected amount", async () => {
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: 125.5,
    });
    axios.post.mockResolvedValue({
      data: {
        data: {
          authorization_url: "https://paystack.test/checkout",
          reference: "ref-123",
        },
      },
    });

    const result = await paymentService.initialize({
      orderId: "order-1",
      gateway: "PAYSTACK",
      email: "buyer@example.com",
      userId: "user-1",
    });

    expect(axios.post).toHaveBeenCalledWith(
      "https://api.paystack.co/transaction/initialize",
      expect.objectContaining({
        email: "buyer@example.com",
        amount: 12550,
        metadata: { orderId: "order-1", userId: "user-1" },
        callback_url: "http://localhost:3000/checkout/success?orderId=order-1",
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer paystack-secret",
        }),
      })
    );
    expect(result).toEqual({
      gateway: "PAYSTACK",
      authorizationUrl: "https://paystack.test/checkout",
      reference: "ref-123",
    });
  });

  test("rejects payment initialization for another user's order", async () => {
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-2",
      status: "PENDING",
      total: 50,
    });

    await expect(
      paymentService.initialize({
        orderId: "order-1",
        gateway: "PAYSTACK",
        email: "buyer@example.com",
        userId: "user-1",
      })
    ).rejects.toThrow("Order not found");
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("keeps Stripe disabled unless explicitly enabled", async () => {
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: 50,
    });

    await expect(
      paymentService.initialize({
        orderId: "order-1",
        gateway: "STRIPE",
        email: "buyer@example.com",
        userId: "user-1",
      })
    ).rejects.toThrow("Stripe checkout is not enabled");
    expect(paymentIntentsCreate).not.toHaveBeenCalled();
  });

  test("marks a pending Paystack order paid only after signature and amount match", async () => {
    const body = {
      event: "charge.success",
      data: {
        amount: 7500,
        metadata: { orderId: "order-1" },
      },
    };
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: 75,
      paymentGateway: "PAYSTACK",
    });
    orderRepository.markPaidIfPending.mockResolvedValue(true);

    const result = await paymentService.verifyPaystackEvent(body, signPaystackBody(body));

    expect(orderRepository.markPaidIfPending).toHaveBeenCalledWith("order-1", undefined);
    expect(result).toEqual({ orderId: "order-1", status: "PAID" });
  });

  test("does not mark an underpaid order paid, and alerts staff to refund", async () => {
    const body = {
      event: "charge.success",
      data: {
        amount: 7400,
        metadata: { orderId: "order-1" },
      },
    };
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: 75,
      paymentGateway: "PAYSTACK",
    });

    const result = await paymentService.verifyPaystackEvent(body, signPaystackBody(body));

    expect(result).toEqual({ orderId: "order-1", status: "PENDING", requiresRefund: true });
    expect(notificationService.notifyRefundRequired).toHaveBeenCalledWith({
      orderId: "order-1",
      gateway: "PAYSTACK",
      amountMinor: 7400,
      reason: "AMOUNT_MISMATCH",
      status: "PENDING",
    });
    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
  });

  test("treats already paid webhook retries as idempotent", async () => {
    const body = {
      event: "charge.success",
      data: {
        amount: 7500,
        metadata: { orderId: "order-1" },
      },
    };
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PAID",
      total: 75,
      paymentGateway: "PAYSTACK",
    });

    const result = await paymentService.verifyPaystackEvent(body, signPaystackBody(body));

    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
    expect(result).toEqual({ orderId: "order-1", status: "PAID", alreadyProcessed: true });
  });

  test("verifies a Paystack transaction using only a validated reference path segment", async () => {
    axios.get.mockResolvedValue({
      data: {
        data: {
          status: "success",
          amount: 7500,
          metadata: { orderId: "order-1" },
        },
      },
    });
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: 75,
      paymentGateway: "PAYSTACK",
    });

    orderRepository.markPaidIfPending.mockResolvedValue(true);

    const result = await paymentService.verifyPaystackTransaction("ref_123-ABC.45", "user-1");

    expect(axios.get).toHaveBeenCalledWith(
      "https://api.paystack.co/transaction/verify/ref_123-ABC.45",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer paystack-secret",
        }),
      })
    );
    expect(orderRepository.markPaidIfPending).toHaveBeenCalledWith("order-1", "ref_123-ABC.45");
    expect(result).toEqual({ orderId: "order-1", status: "PAID" });
  });

  test("does not confirm another customer's order from a verify request", async () => {
    axios.get.mockResolvedValue({
      data: { data: { status: "success", amount: 7500, metadata: { orderId: "order-1" } } },
    });
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "PENDING",
      total: 75,
      paymentGateway: "PAYSTACK",
    });

    const result = await paymentService.verifyPaystackTransaction("ref_123", "someone-else");

    expect(result).toBeNull();
    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
  });

  test("acknowledges payment for a cancelled order and flags it for refund", async () => {
    const body = { event: "charge.success", data: { amount: 7500, metadata: { orderId: "order-1" } } };
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "CANCELLED",
      total: 75,
      paymentGateway: "PAYSTACK",
    });

    const result = await paymentService.verifyPaystackEvent(body, signPaystackBody(body));

    expect(result).toEqual({ orderId: "order-1", status: "CANCELLED", requiresRefund: true });
    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
    expect(notificationService.notifyRefundRequired).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1", reason: "NOT_PAYABLE", status: "CANCELLED" })
    );
  });

  test("still acknowledges the webhook if the staff alert fails", async () => {
    const body = { event: "charge.success", data: { amount: 7500, metadata: { orderId: "order-1" } } };
    orderRepository.findOrderById.mockResolvedValue({
      id: "order-1",
      userId: "user-1",
      status: "CANCELLED",
      total: 75,
      paymentGateway: "PAYSTACK",
    });
    notificationService.notifyRefundRequired.mockRejectedValueOnce(new Error("db down"));

    await expect(paymentService.verifyPaystackEvent(body, signPaystackBody(body))).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED",
      requiresRefund: true,
    });
  });

  test("flags a refund when the order is cancelled between reading and paying", async () => {
    const body = { event: "charge.success", data: { amount: 7500, metadata: { orderId: "order-1" } } };
    orderRepository.findOrderById
      .mockResolvedValueOnce({ id: "order-1", userId: "user-1", status: "PENDING", total: 75, paymentGateway: "PAYSTACK" })
      .mockResolvedValueOnce({ id: "order-1", userId: "user-1", status: "CANCELLED", total: 75, paymentGateway: "PAYSTACK" });
    orderRepository.markPaidIfPending.mockResolvedValue(false);

    const result = await paymentService.verifyPaystackEvent(body, signPaystackBody(body));

    expect(result).toEqual({ orderId: "order-1", status: "CANCELLED", requiresRefund: true });
  });

  test("rejects Paystack webhooks with a forged signature", async () => {
    const body = { event: "charge.success", data: { amount: 7500, metadata: { orderId: "order-1" } } };

    await expect(paymentService.verifyPaystackEvent(body, "not-a-real-signature")).rejects.toThrow(
      "Paystack Webhook Signature Verification Failed"
    );
    expect(orderRepository.findOrderById).not.toHaveBeenCalled();
  });

  test("rejects malformed Paystack references before making an outbound request", async () => {
    await expect(
      paymentService.verifyPaystackTransaction("../balance?x=1")
    ).rejects.toThrow("Invalid transaction reference");

    expect(axios.get).not.toHaveBeenCalled();
    expect(orderRepository.findOrderById).not.toHaveBeenCalled();
    expect(orderRepository.markPaidIfPending).not.toHaveBeenCalled();
  });
});
