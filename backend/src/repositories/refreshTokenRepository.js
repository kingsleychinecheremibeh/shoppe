import { prisma } from "../config/db.js";

export const refreshTokenRepository = {
  createSession: ({ userId, userAgent, ip }) => {
    return prisma.session.create({
      data: { userId, userAgent, ip },
    });
  },

  create: ({ sessionId, tokenHash, expiresAt, userAgent, ip }) => {
    return prisma.refreshToken.create({
      data: { sessionId, tokenHash, expiresAt, userAgent, ip },
    });
  },

  findByHash: (tokenHash) => {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      include: {
        session: true,
      },
    });
  },

  findActiveSession: ({ sessionId, userId }) => {
    return prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        refreshTokens: {
          some: {
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
        },
      },
      select: { id: true },
    });
  },

  revokeByHash: (tokenHash) => {
    return prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  revokeAllForUser: (userId) => {
    return prisma.refreshToken.updateMany({
      where: {
        session: { userId },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
};
