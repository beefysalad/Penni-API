import { prisma } from "../lib/prisma.js";

export const healthRepository = {
  getHealthStatus: async () => {
    let database: "up" | "down" = "down";

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
