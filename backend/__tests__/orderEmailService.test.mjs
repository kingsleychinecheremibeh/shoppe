import { jest } from "@jest/globals";

const sendMail = jest.fn();
const logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };

await jest.unstable_mockModule("../src/config/mailer.js", () => ({ sendMail, isMailerConfigured: () => true }));
await jest.unstable_mockModule("../src/utils/logger.js", () => ({ logger }));

const { orderEmailService } = await import("../src/services/orderEmailService.js");

const order = {
  id: "159d362c-0000-4000-8000-000000000000",
  total: "70500",
  shippingFee: "2500",
  shippingMethodName: "Standard Delivery",
  shippingName: "Ada <b>Obi</b>",
  shippingStreet: "3 Akin Street",
  shippingCity: "Ikeja",
  shippingState: "Lagos",
  user: { name: "Ada Obi", email: "ada@example.com" },
  orderItems: [{ quantity: 1, price: "68000", product: { name: "Studio Headphones Pro" } }],
};

describe("orderEmailService", () => {
  beforeEach(() => jest.clearAllMocks());

  test("sends an order confirmation with items, total and short order number", async () => {
    await orderEmailService.sendOrderConfirmed(order);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe("ada@example.com");
    expect(mail.subject).toBe("Shoppe: order #159D362C confirmed");
    expect(mail.text).toContain("Studio Headphones Pro × 1");
    expect(mail.text).toContain("Total: ₦70,500");
    expect(mail.html).toContain("Ada &lt;b&gt;Obi&lt;/b&gt;");
    expect(mail.html).not.toContain("<b>Obi</b>");
  });

  test("sends a shipped email", async () => {
    await orderEmailService.sendOrderShipped(order);
    expect(sendMail.mock.calls[0][0].subject).toBe("Shoppe: order #159D362C is on its way");
  });

  test("skips orders without a customer email", async () => {
    await orderEmailService.sendOrderConfirmed({ ...order, user: null });
    expect(sendMail).not.toHaveBeenCalled();
  });

  test("never throws when the mail server fails", async () => {
    sendMail.mockRejectedValueOnce(new Error("SMTP down"));
    await expect(orderEmailService.sendOrderShipped(order)).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });
});
