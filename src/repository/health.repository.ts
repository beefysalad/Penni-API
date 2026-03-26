import { prisma } from "../lib/prisma.js";

export const healthRepository = {
  getHealthStatus: async () => {
    let database = "down";

    try {
      await prisma.$queryRaw`SELECT 1`;
      database = "up";
    } catch {
      database = "down";
    }

    return {
      ok: database === "up",
      database,
    };
  },
};
