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
import { transactionRoutes } from "./routes/transaction.routes.js";
import { plannedItemRoutes } from "./routes/planned-item.routes.js";
import { budgetRoutes } from "./routes/budget.routes.js";

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
  server.register(transactionRoutes, { prefix: "/api" });
  server.register(plannedItemRoutes, { prefix: "/api" });
  server.register(budgetRoutes, { prefix: "/api" });

  return server;
}

const server = buildServer();

export default server;

const start = async () => {
  try {
    const address = await server.listen({ port: env.port, host: env.host });
    console.log(`Server is running on ${address}`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

const shutdown = async (signal: NodeJS.Signals) => {
  try {
    server.log.info(`Received ${signal}. Shutting down gracefully...`);
    await server.close();
    process.exit(0);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

if (process.env.VERCEL !== "1" && env.nodeEnv !== "test") {
  void start();
}
