import fastify from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.routes.js";
import { swaggerPlugin } from "./plugins/swagger.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { corsPlugin } from "./plugins/cors.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { clerkAuthPlugin } from "./plugins/clerk-auth.js";
import { userRoutes } from "./routes/user.routes.js";
import { accountRoutes } from "./routes/account.routes.js";
import { categoryRoutes } from "./routes/category.routes.js";

export function buildServer() {
  const server = fastify({
    logger: env.nodeEnv === "development",
  }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  server.register(prismaPlugin);

  server.register(corsPlugin);
  server.register(swaggerPlugin);
  server.register(errorHandlerPlugin);
  server.register(clerkAuthPlugin);

  server.register(healthRoutes, { prefix: "/api" });
  server.register(userRoutes, { prefix: "/api" });
  server.register(accountRoutes, { prefix: "/api" });
  server.register(categoryRoutes, { prefix: "/api" });

  return server;
}
