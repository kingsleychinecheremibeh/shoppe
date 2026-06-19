import { prisma } from "../config/db.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  managerPermissions: true,
  createdAt: true,
  deletedAt: true,
}

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  managerPermissions: true,
  password: true,
  createdAt: true,
  deletedAt: true,
}

export const userRepository = {
  // Find user by email (login / duplicate check)
  findAuthByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  },

  findPublicByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  },

  findByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  },

  findAuthUserByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  },

  // Find user by ID (auth middleware / profile)
  findById: (id) => {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  },

  findStaffByPermission: (permission) => {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { role: "ADMIN" },
          {
            role: "MANAGER",
            managerPermissions: { has: permission },
          },
        ],
      },
      select: publicUserSelect,
    });
  },

  findCustomersForProductAnnouncements: () => {
    return prisma.user.findMany({
      where: {
        role: "USER",
        deletedAt: null,
      },
      select: publicUserSelect,
    });
  },

  findAllForAdmin: () => {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: publicUserSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  // Create new user (register)
  create: (data) => {
    return prisma.user.create({
      data,
      select: publicUserSelect,
    });
  },

  // Update user (profile edits later)
  update: (id, data) => {
    return prisma.user.update({
      where: { id },
      data,
      select: publicUserSelect,
    });
  },

  // Delete user (admin-only or account deletion)
  delete: (id) => {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
