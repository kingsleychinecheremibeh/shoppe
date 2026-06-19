import express from "express";
import { getAdminAnalytics } from "../controllers/adminAnalyticsController.js";
import { getAdminUsers, updateUserRole } from "../controllers/adminUserController.js";
import { protect, adminOnly, staffWithPermission } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { updateUserRoleSchema } from "../validators/adminUserValidator.js";

const router = express.Router();

router.get("/analytics", protect, staffWithPermission("ANALYTICS"), getAdminAnalytics);
router.get("/users", protect, adminOnly, getAdminUsers);
router.put("/users/:id/role", protect, adminOnly, validate(updateUserRoleSchema), updateUserRole);

export default router;
