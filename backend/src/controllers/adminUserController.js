import { userRepository } from "../repositories/userRepository.js";
import { auditRepository } from "../repositories/auditRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const normalizeManagerPermissions = (role, managerPermissions) => {
  if (role !== "MANAGER") return [];
  return managerPermissions || [];
};

export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await userRepository.findAllForAdmin();
  res.json(users);
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role, managerPermissions } = req.body;

  if (req.params.id === req.user.id && role !== "ADMIN") {
    throw new AppError("You cannot remove your own admin access.", 400);
  }

  const user = await userRepository.update(req.params.id, {
    role,
    managerPermissions: normalizeManagerPermissions(role, managerPermissions),
  });

  await auditRepository.log({
    req,
    action: "USER_ROLE_UPDATED",
    entity: "USER",
    entityId: user.id,
    metadata: {
      role: user.role,
      managerPermissions: user.managerPermissions,
    },
  });

  res.json(user);
});
