import { jest } from "@jest/globals";

const tx = {
  passwordResetToken: { updateMany: jest.fn() },
  user: { update: jest.fn() },
};

await jest.unstable_mockModule("../src/config/db.js", () => ({
  prisma: {
    passwordResetToken: { deleteMany: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn((callback) => callback(tx)),
  },
}));

const { prisma } = await import("../src/config/db.js");
const { passwordResetRepository } = await import("../src/repositories/passwordResetRepository.js");

describe("passwordResetRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  test("only finds unused, unexpired tokens", async () => {
    await passwordResetRepository.findValidByHash("hash-1");

    const { where } = prisma.passwordResetToken.findFirst.mock.calls[0][0];
    expect(where.tokenHash).toBe("hash-1");
    expect(where.usedAt).toBeNull();
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
  });

  test("sets the password only when it wins the race to consume the token", async () => {
    tx.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(
      passwordResetRepository.consumeAndSetPassword({ tokenId: "tok-1", userId: "user-1", passwordHash: "h" })
    ).resolves.toBe(true);
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: "user-1" }, data: { password: "h" } });

    tx.user.update.mockClear();
    await expect(
      passwordResetRepository.consumeAndSetPassword({ tokenId: "tok-1", userId: "user-1", passwordHash: "h" })
    ).resolves.toBe(false);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  test("clears outstanding tokens before issuing a new one", async () => {
    await passwordResetRepository.invalidateForUser("user-1");

    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1", usedAt: null } });
  });
});
