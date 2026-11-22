import { jest } from "@jest/globals";

const notificationRepository = { createMany: jest.fn() };
const userRepository = { findStaffByPermission: jest.fn() };

await jest.unstable_mockModule("../src/repositories/notificationRepository.js", () => ({ notificationRepository }));
await jest.unstable_mockModule("../src/repositories/userRepository.js", () => ({ userRepository }));

const { notificationService } = await import("../src/services/notificationService.js");

const ORDER_ID = "3f2c71aa-1b2c-4d5e-8f90-123456789abc";

describe("notificationService.notifyRefundRequired", () => {
  beforeEach(() => jest.clearAllMocks());

  test("alerts every admin and order manager once per order and amount", async () => {
    userRepository.findStaffByPermission.mockResolvedValue([{ id: "admin-1" }, { id: "mgr-1" }]);

    await notificationService.notifyRefundRequired({
      orderId: ORDER_ID,
      gateway: "PAYSTACK",
      amountMinor: 7500,
      reason: "NOT_PAYABLE",
      status: "CANCELLED",
    });

    expect(userRepository.findStaffByPermission).toHaveBeenCalledWith("ORDER_MANAGEMENT");
    const [notifications] = notificationRepository.createMany.mock.calls[0];
    expect(notifications).toHaveLength(2);
    expect(notifications[0]).toMatchObject({
      userId: "admin-1",
      audience: "STAFF",
      type: "REFUND_REQUIRED",
      title: "Refund needed",
      dedupeKey: `admin-1:REFUND_REQUIRED:${ORDER_ID}:7500`,
    });
    expect(notifications[0].message).toContain("#3F2C71AA");
    expect(notifications[0].message).toContain("75.00");
    expect(notifications[0].message).toContain("already cancelled");
  });

  test("explains amount mismatches", async () => {
    userRepository.findStaffByPermission.mockResolvedValue([{ id: "admin-1" }]);

    await notificationService.notifyRefundRequired({
      orderId: ORDER_ID,
      gateway: "PAYSTACK",
      amountMinor: 7400,
      reason: "AMOUNT_MISMATCH",
      status: "PENDING",
    });

    const [[notification]] = notificationRepository.createMany.mock.calls[0];
    expect(notification.message).toContain("did not match the order total");
  });

  test("ignores malformed order ids", async () => {
    await notificationService.notifyRefundRequired({ orderId: "not-a-uuid", gateway: "PAYSTACK", amountMinor: 1 });

    expect(userRepository.findStaffByPermission).not.toHaveBeenCalled();
    expect(notificationRepository.createMany).not.toHaveBeenCalled();
  });
});
