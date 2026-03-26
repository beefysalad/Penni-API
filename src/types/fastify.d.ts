import type { FastifyRequest } from "fastify";
import type { PrismaClient } from "../generated/prisma/client.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (request: FastifyRequest) => Promise<void>;
  }

  interface FastifyRequest {
    auth:
      | {
          clerkUserId: string;
          sessionId: string | null;
        }
      | null;
  }
}
