import { prisma } from "../config/db.js";

export const addressRepository = {
    findAllByUserId: (userId) => {
        return prisma.address.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },

    findById: (id) => {
        return prisma.address.findUnique({
            where: { id },
            include: { orders: true },
        });
    },

    create: (data) => {
        return prisma.address.create({ data });
    },

    update: (id, data) => {
        return prisma.address.update({ where: { id }, data });
    },

    delete: (id) => {
        return prisma.address.delete({ where: { id } });
    },
};
