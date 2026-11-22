import { prisma } from "../config/db.js";

export const passwordResetRepository = {
  /** Removes any outstanding (unused) reset tokens for the user before issuing a new one. */
  invalidateForUser: (userId) => {
    return prisma.passwordResetToken.deleteMany({
      where: { userId, usedAt: null },
    });
  },

  create: ({ userId, tokenHash, expiresAt }) => {
    return prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  findValidByHash: (tokenHash) => {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  /**
   * Sets the new password and consumes the token atomically. The token is only consumed if it is
   * still unused, so two simultaneous requests with the same link cannot both succeed.
   * Returns true when the password was changed.
   */
  consumeAndSetPassword: ({ tokenId, userId, passwordHash }) => {
    return prisma.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { id: tokenId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1) return false;

      await tx.user.update({ where: { id: userId }, data: { password: passwordHash } });
      return true;
    });
  },
};
