import fp from "fastify-plugin";
import { prisma } from "../lib/prisma.js";

export const prismaPlugin = fp(async (fastify) => {
  fastify.decorate("prisma", prisma);

  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
