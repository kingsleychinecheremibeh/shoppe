import { jest } from "@jest/globals";
import crypto from "crypto";

const orderRepository = {
  findOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
};

const axios = {
  post: jest.fn(),
};

const paymentIntentsCreate = jest.fn();
const constructEvent = jest.fn();

await jest.unstable_mockModule("../src/repositories/orderRepository.js", () => ({
  orderRepository,
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
    orderRepository.updateOrderStatus.mockResolvedValue({ id: "order-1", status: "PAID" });

    const result = await paymentService.verifyPaystackEvent(body, signPaystackBody(body));

    expect(orderRepository.updateOrderStatus).toHaveBeenCalledWith("order-1", "PAID");
    expect(result).toEqual({ orderId: "order-1", status: "PAID" });
  });

  test("rejects Paystack webhooks with mismatched amounts", async () => {
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

    await expect(paymentService.verifyPaystackEvent(body, signPaystackBody(body))).rejects.toThrow(
      "Payment amount does not match order total"
    );
    expect(orderRepository.updateOrderStatus).not.toHaveBeenCalled();
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

    expect(orderRepository.updateOrderStatus).not.toHaveBeenCalled();
    expect(result).toEqual({ orderId: "order-1", status: "PAID", alreadyProcessed: true });
  });
});
