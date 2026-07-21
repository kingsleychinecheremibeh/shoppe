import { prisma } from "../config/db.js";

export const emailOtpRepository = {
  invalidateActive: ({ userId, purpose }) => prisma.emailOtp.updateMany({
    where: { userId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  }),

  create: (data) => prisma.emailOtp.create({ data }),

  findLatestActive: ({ userId, purpose }) => prisma.emailOtp.findFirst({
    where: { userId, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  }),

  incrementAttempts: (id) => prisma.emailOtp.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  }),

  consume: (id) => prisma.emailOtp.updateMany({
    where: { id, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  }),
};
