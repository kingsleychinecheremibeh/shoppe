import { prisma } from "../config/db.js";
import { logger } from "../utils/logger.js";

export const auditRepository = {
  async log({ req, action, entity, entityId, metadata }) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req?.user?.id,
          ip: req?.ip,
          userAgent: req?.get?.("user-agent"),
          action,
          entity,
          entityId,
          metadata,
        },
      });
    } catch (err) {
      logger.warn("Audit log write failed", { error: err.message, action, entity, entityId });
    }
  },
};
