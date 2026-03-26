import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { healthController } from "../controllers/health.controller.js";
import { healthRouteSchema } from "../schemas/health.schema.js";

export async function healthRoutes(server: FastifyInstance) {
  const app = server.withTypeProvider<ZodTypeProvider>();

  app.get("/health", { schema: healthRouteSchema }, healthController.getHealthStatus);
}
