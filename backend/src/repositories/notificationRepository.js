import { prisma } from "../config/db.js";

export const notificationRepository = {
  createMany: (notifications) => {
    if (!notifications.length) return { count: 0 };
    return prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
  },

  findForUser: (userId, { unreadOnly = false, limit = 50 } = {}) => {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  markRead: (id, userId) => {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
  },

  markAllReadForUser: (userId) => {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};
