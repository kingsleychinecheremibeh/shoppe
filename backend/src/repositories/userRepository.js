import { prisma } from "../config/db.js";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  deletedAt: true,
}

const authUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  password: true,
  createdAt: true,
  deletedAt: true,
}

export const userRepository = {
  // Find user by email (login / duplicate check)
  findAuthUserByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  },

  findByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email },
      select: publicUserSelect,
    });
  },

  // Find user by ID (auth middleware / profile)
  findById: (id) => {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
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
